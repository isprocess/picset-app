import assert from 'node:assert/strict'
import test from 'node:test'

import signingConfig from '../src/signing-config.cjs'

const { SigningConfigError, resolveSigningConfiguration } = signingConfig

test('uses unsigned mode when all signing variables are absent', () => {
  assert.deepEqual(resolveSigningConfiguration({}), {
    macSigned: false,
    windowsSigned: false,
  })
})

test('uses signed mode for complete credential sets', () => {
  assert.deepEqual(
    resolveSigningConfiguration({
      CSC_LINK: '/tmp/mac.p12',
      CSC_KEY_PASSWORD: 'mac-password',
      APPLE_API_KEY: '/tmp/AuthKey_TEST.p8',
      APPLE_API_KEY_ID: 'key-id',
      APPLE_API_ISSUER_ID: 'issuer-id',
      WIN_CSC_LINK: '/tmp/windows.pfx',
      WIN_CSC_KEY_PASSWORD: 'windows-password',
    }),
    {
      macSigned: true,
      windowsSigned: true,
    },
  )
})

for (const env of [
  { CSC_LINK: '/tmp/mac.p12' },
  {
    CSC_LINK: '/tmp/mac.p12',
    CSC_KEY_PASSWORD: 'mac-password',
    APPLE_API_KEY: '/tmp/AuthKey_TEST.p8',
    APPLE_API_ISSUER_ID: 'issuer-id',
  },
  { WIN_CSC_LINK: '/tmp/windows.pfx' },
]) {
  test(`rejects incomplete signing configuration: ${JSON.stringify(env)}`, () => {
    assert.throws(
      () => resolveSigningConfiguration(env),
      (error) => error instanceof SigningConfigError
        && error.code === 'PICSET_DESKTOP_SIGNING_CONFIG_INVALID',
    )
  })
}
