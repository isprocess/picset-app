import assert from 'node:assert/strict'
import test from 'node:test'

import loadFailurePolicy from '../src/load-failure-policy.cjs'

const { shouldShowLoadFailure } = loadFailurePolicy

test('shows a retry dialog for a main-frame network failure', () => {
  assert.equal(shouldShowLoadFailure({ errorCode: -105, isMainFrame: true }), true)
})

test('does not show a dialog for an aborted navigation', () => {
  assert.equal(shouldShowLoadFailure({ errorCode: -3, isMainFrame: true }), false)
})

test('does not show a dialog for a subframe failure', () => {
  assert.equal(shouldShowLoadFailure({ errorCode: -105, isMainFrame: false }), false)
})
