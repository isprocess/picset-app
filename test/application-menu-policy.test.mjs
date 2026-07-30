import assert from 'node:assert/strict'
import test from 'node:test'

import applicationMenuPolicy from '../src/application-menu-policy.cjs'

const { removeDefaultApplicationMenu } = applicationMenuPolicy

test('suppresses the default Electron application menu', () => {
  const calls = []

  removeDefaultApplicationMenu({
    setApplicationMenu(value) {
      calls.push(value)
    },
  })

  assert.deepEqual(calls, [null])
})
