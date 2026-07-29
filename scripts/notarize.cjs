const { stat } = require('node:fs/promises')
const { join } = require('node:path')

function buildNotarizationOptions({ appPath, env = process.env }) {
  const appleApiKey = env.APPLE_API_KEY
  const appleApiKeyId = env.APPLE_API_KEY_ID
  const appleApiIssuer = env.APPLE_API_ISSUER_ID

  if (!appleApiKey || !appleApiKeyId || !appleApiIssuer) {
    throw new Error('macOS notarization credentials are incomplete.')
  }

  return {
    appPath,
    appleApiKey,
    appleApiKeyId,
    appleApiIssuer,
  }
}

exports.buildNotarizationOptions = buildNotarizationOptions

exports.default = async function notarizeApp(context) {
  if (context.electronPlatformName !== 'darwin') return

  const options = buildNotarizationOptions({
    appPath: join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`,
    ),
  })

  await stat(options.appleApiKey)

  const { notarize } = await import('@electron/notarize')
  await notarize(options)
}
