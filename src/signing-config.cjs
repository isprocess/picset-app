class SigningConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SigningConfigError'
    this.code = 'PICSET_DESKTOP_SIGNING_CONFIG_INVALID'
  }
}

function classifyCredentialGroup(env, names, label) {
  const present = names.filter((name) => Boolean(env[name]))

  if (present.length === 0) return false
  if (present.length === names.length) return true

  throw new SigningConfigError(`${label} signing credentials are incomplete.`)
}

function resolveSigningConfiguration(env = process.env) {
  return {
    macSigned: classifyCredentialGroup(
      env,
      [
        'CSC_LINK',
        'CSC_KEY_PASSWORD',
        'APPLE_API_KEY',
        'APPLE_API_KEY_ID',
        'APPLE_API_ISSUER_ID',
      ],
      'macOS',
    ),
    windowsSigned: classifyCredentialGroup(
      env,
      ['WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD'],
      'Windows',
    ),
  }
}

module.exports = {
  SigningConfigError,
  resolveSigningConfiguration,
}
