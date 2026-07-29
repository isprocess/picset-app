const { readFileSync } = require('node:fs')
const { join } = require('node:path')

class RuntimeConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RuntimeConfigError'
    this.code = 'PICSET_DESKTOP_CONFIG_INVALID'
  }
}

function failConfig() {
  throw new RuntimeConfigError('Desktop runtime configuration is invalid.')
}

function normalizeDesktopWebUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') failConfig()

  let url
  try {
    url = new URL(value.trim())
  } catch {
    failConfig()
  }

  if (
    url.protocol !== 'https:'
    || !url.hostname
    || url.username
    || url.password
    || url.search
    || url.hash
    || url.pathname !== '/'
  ) {
    failConfig()
  }

  return url.origin
}

function buildRuntimeConfig(value) {
  return { webUrl: normalizeDesktopWebUrl(value) }
}

function parseRuntimeConfig(serialized) {
  let parsed
  try {
    parsed = JSON.parse(serialized)
  } catch {
    failConfig()
  }

  if (
    !parsed
    || typeof parsed !== 'object'
    || Array.isArray(parsed)
    || Object.keys(parsed).length !== 1
    || Object.keys(parsed)[0] !== 'webUrl'
  ) {
    failConfig()
  }

  return buildRuntimeConfig(parsed.webUrl)
}

function loadRuntimeConfig(filePath) {
  try {
    return parseRuntimeConfig(readFileSync(filePath, 'utf8'))
  } catch (error) {
    if (error instanceof RuntimeConfigError) throw error
    failConfig()
  }
}

function resolveRuntimeConfigPath({ isPackaged, resourcesPath, appPath }) {
  return isPackaged
    ? join(resourcesPath, 'runtime-config.json')
    : join(appPath, 'build', 'generated', 'runtime-config.json')
}

module.exports = {
  RuntimeConfigError,
  buildRuntimeConfig,
  loadRuntimeConfig,
  normalizeDesktopWebUrl,
  resolveRuntimeConfigPath,
}
