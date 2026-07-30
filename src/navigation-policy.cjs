const { normalizeDesktopWebUrl } = require('./runtime-config.cjs')

function classifyNavigation(rawUrl, allowedOrigin) {
  let target
  try {
    target = new URL(rawUrl)
  } catch {
    return { kind: 'deny' }
  }

  if (target.protocol !== 'https:' || target.username || target.password) {
    return { kind: 'deny' }
  }

  const normalizedAllowedOrigin = normalizeDesktopWebUrl(allowedOrigin)
  const normalizedTarget = target.toString()

  if (target.origin === normalizedAllowedOrigin) {
    return { kind: 'same-origin', url: normalizedTarget }
  }

  return { kind: 'external', url: normalizedTarget }
}

function applyNavigationPolicy({ webContents, allowedOrigin, openExternalUrl }) {
  const handleMainFrameNavigation = (details) => {
    if (!details.isMainFrame) return

    const decision = classifyNavigation(details.url, allowedOrigin)
    if (decision.kind === 'same-origin') return

    details.preventDefault()
    if (decision.kind === 'external') openExternalUrl(decision.url)
  }

  webContents.setWindowOpenHandler(({ url }) => {
    const decision = classifyNavigation(url, allowedOrigin)
    if (decision.kind === 'external') openExternalUrl(decision.url)
    return { action: 'deny' }
  })

  webContents.on('will-navigate', handleMainFrameNavigation)
  webContents.on('will-redirect', handleMainFrameNavigation)
  webContents.on('will-attach-webview', (event) => event.preventDefault())
}

module.exports = {
  applyNavigationPolicy,
  classifyNavigation,
}
