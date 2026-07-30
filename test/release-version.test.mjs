import assert from 'node:assert/strict'
import test from 'node:test'

import { assertReleaseVersion } from '../scripts/assert-release-version.mjs'

test('accepts a tag that exactly matches the package version', () => {
  assert.doesNotThrow(() => {
    assertReleaseVersion({ tag: 'v0.1.1', version: '0.1.1' })
  })
})

test('rejects a missing release tag', () => {
  assert.throws(
    () => assertReleaseVersion({ tag: '', version: '0.1.1' }),
    (error) => error.code === 'PICSET_DESKTOP_RELEASE_TAG_MISSING',
  )
})

test('rejects a tag that does not exactly match the package version', () => {
  assert.throws(
    () => assertReleaseVersion({ tag: 'v0.1.0', version: '0.1.1' }),
    (error) => error.code === 'PICSET_DESKTOP_RELEASE_VERSION_MISMATCH',
  )
})
