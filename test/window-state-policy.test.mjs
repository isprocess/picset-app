import assert from 'node:assert/strict'
import test from 'node:test'

import windowStatePolicy from '../src/window-state-policy.cjs'

const {
  applyAuthenticatedWindowState,
  shouldMaximizeForNavigation,
} = windowStatePolicy
const allowedOrigin = 'https://picset.example.test'

function createWindowHarness() {
  const handlers = new Map()
  let maximizeCalls = 0

  return {
    webContents: {
      on(eventName, handler) {
        handlers.set(eventName, handler)
      },
    },
    isDestroyed: () => false,
    maximize() {
      maximizeCalls += 1
    },
    navigate(url) {
      handlers.get('did-navigate')({}, url)
    },
    get maximizeCalls() {
      return maximizeCalls
    },
  }
}

test('keeps login at the initial size and maximizes once after login', () => {
  const window = createWindowHarness()

  applyAuthenticatedWindowState({ window, allowedOrigin })
  window.navigate('https://picset.example.test/login?next=%2F')
  assert.equal(window.maximizeCalls, 0)

  window.navigate('https://picset.example.test/')
  window.navigate('https://picset.example.test/short-drama')
  assert.equal(window.maximizeCalls, 1)
})

test('rejects invalid and cross-origin navigation', () => {
  assert.equal(shouldMaximizeForNavigation('not a URL', allowedOrigin), false)
  assert.equal(
    shouldMaximizeForNavigation('https://docs.example.test/', allowedOrigin),
    false,
  )
  assert.equal(
    shouldMaximizeForNavigation(
      'https://user:password@picset.example.test/',
      allowedOrigin,
    ),
    false,
  )
})
