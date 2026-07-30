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
  let hasMaximized = false

  window.webContents.on('did-navigate', (_event, url) => {
    if (hasMaximized || window.isDestroyed()) return
    if (!shouldMaximizeForNavigation(url, allowedOrigin)) return

    hasMaximized = true
    if (window.isVisible()) {
      window.maximize()
      return
    }

    window.once('ready-to-show', () => {
      if (!window.isDestroyed()) window.maximize()
    })
  })
}

module.exports = {
  applyAuthenticatedWindowState,
  shouldMaximizeForNavigation,
}
