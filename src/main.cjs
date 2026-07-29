const { app, BrowserWindow, dialog, session, shell } = require('electron')

const {
  RuntimeConfigError,
  loadRuntimeConfig,
  resolveRuntimeConfigPath,
} = require('./runtime-config.cjs')
const { shouldShowLoadFailure } = require('./load-failure-policy.cjs')
const { classifyNavigation } = require('./navigation-policy.cjs')
const { createMainWindowOptions } = require('./window-options.cjs')

let desktopConfig
let mainWindow
let showingLoadFailure = false

function openExternalUrl(url) {
  void shell.openExternal(url).catch(() => undefined)
}

function configureSessionPolicy() {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  )
  session.defaultSession.setPermissionCheckHandler(() => false)
}

async function showLoadFailure(window) {
  if (showingLoadFailure || window.isDestroyed()) return

  showingLoadFailure = true
  try {
    const result = await dialog.showMessageBox(window, {
      type: 'error',
      buttons: ['Retry', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      message: 'PicSet Desktop cannot open the service.',
      detail: 'Check the network connection and try again.',
    })

    if (result.response === 0 && !window.isDestroyed()) {
      void loadConfiguredPage(window)
      return
    }

    app.quit()
  } finally {
    showingLoadFailure = false
  }
}

function applyNavigationPolicy(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    const decision = classifyNavigation(url, desktopConfig.webUrl)
    if (decision.kind === 'external') openExternalUrl(decision.url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    const decision = classifyNavigation(url, desktopConfig.webUrl)
    if (decision.kind === 'same-origin') return

    event.preventDefault()
    if (decision.kind === 'external') openExternalUrl(decision.url)
  })

  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
}

function loadConfiguredPage(window) {
  void window.loadURL(desktopConfig.webUrl).catch(() => {
    void showLoadFailure(window)
  })
}

function createMainWindow() {
  const window = new BrowserWindow(createMainWindowOptions())

  applyNavigationPolicy(window)
  window.webContents.on(
    'did-fail-load',
    (_event, errorCode, _errorDescription, _validatedUrl, isMainFrame) => {
      if (shouldShowLoadFailure({ errorCode, isMainFrame })) {
        void showLoadFailure(window)
      }
    },
  )
  window.once('ready-to-show', () => window.show())
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined
  })

  mainWindow = window
  loadConfiguredPage(window)
  return window
}

async function bootstrap() {
  await app.whenReady()

  try {
    desktopConfig = loadRuntimeConfig(
      resolveRuntimeConfigPath({
        isPackaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
        appPath: app.getAppPath(),
      }),
    )
  } catch (error) {
    if (!(error instanceof RuntimeConfigError)) {
      console.error('Unable to read desktop runtime configuration.')
    }

    await dialog.showMessageBox({
      type: 'error',
      buttons: ['Quit'],
      defaultId: 0,
      noLink: true,
      message: 'PicSet Desktop configuration is unavailable.',
      detail: 'Reinstall the application or contact the release administrator.',
    })
    app.quit()
    return
  }

  configureSessionPolicy()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

void bootstrap()
