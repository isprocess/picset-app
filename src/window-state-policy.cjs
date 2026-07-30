const { normalizeDesktopWebUrl } = require('./runtime-config.cjs')

function shouldMaximizeForNavigation(rawUrl, allowedOrigin) {
  let target
  try {
    target = new URL(rawUrl)
  } catch {
    return false
  }

  if (
    target.protocol !== 'https:'
    || target.username
    || target.password
    || target.origin !== normalizeDesktopWebUrl(allowedOrigin)
  ) {
    return false
  }

  return target.pathname !== '/login'
}

function applyAuthenticatedWindowState({ window, allowedOrigin }) {
  let hasShown = false
  let hasMaximized = false
  let maximizeWhenShown = false

  window.once('ready-to-show', () => {
    if (window.isDestroyed()) return

    window.show()
    hasShown = true
    if (maximizeWhenShown) window.maximize()
  })

  window.webContents.on('did-navigate', (_event, url) => {
    if (hasMaximized || window.isDestroyed()) return
    if (!shouldMaximizeForNavigation(url, allowedOrigin)) return

    hasMaximized = true
    if (hasShown) {
      window.maximize()
      return
    }

    maximizeWhenShown = true
  })
}

module.exports = {
  applyAuthenticatedWindowState,
  shouldMaximizeForNavigation,
}
