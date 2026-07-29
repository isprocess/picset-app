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

module.exports = { classifyNavigation }
