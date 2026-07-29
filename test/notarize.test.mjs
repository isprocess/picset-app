import assert from 'node:assert/strict'
import test from 'node:test'

import notarizeModule from '../scripts/notarize.cjs'

const { buildNotarizationOptions } = notarizeModule

test('builds notarization options with the Apple API key ID', () => {
  assert.deepEqual(
    buildNotarizationOptions({
      appPath: '/tmp/PicSet Desktop.app',
      env: {
        APPLE_API_KEY: '/tmp/AuthKey_TEST.p8',
        APPLE_API_KEY_ID: 'key-id',
        APPLE_API_ISSUER_ID: 'issuer-id',
      },
    }),
    {
      appPath: '/tmp/PicSet Desktop.app',
      appleApiKey: '/tmp/AuthKey_TEST.p8',
      appleApiKeyId: 'key-id',
      appleApiIssuer: 'issuer-id',
    },
  )
})

test('rejects notarization options without the Apple API key ID', () => {
  assert.throws(
    () => buildNotarizationOptions({
      appPath: '/tmp/PicSet Desktop.app',
      env: {
        APPLE_API_KEY: '/tmp/AuthKey_TEST.p8',
        APPLE_API_ISSUER_ID: 'issuer-id',
      },
    }),
    /notarization credentials are incomplete/i,
  )
})
