import assert from 'node:assert/strict'
import test from 'node:test'

import packagingPolicy from '../src/packaging-policy.cjs'

const { PackagingPolicyError, skipNodeModuleHandling } = packagingPolicy

test('skips node module handling for a dependency-free desktop shell', () => {
  assert.equal(
    skipNodeModuleHandling({
      name: 'picset-desktop',
      devDependencies: { electron: '43.2.0' },
    }),
    false,
  )
})

test('rejects production dependencies that would be omitted from the package', () => {
  assert.throws(
    () => skipNodeModuleHandling({
      name: 'picset-desktop',
      dependencies: { 'runtime-library': '1.0.0' },
    }),
    (error) => error instanceof PackagingPolicyError
      && error.code === 'PICSET_DESKTOP_RUNTIME_DEPENDENCIES_UNSUPPORTED',
  )
})
