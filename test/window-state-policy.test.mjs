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
  const lifecycleEvents = []
  let visible = false
  let maximizeCalls = 0

  return {
    webContents: {
      on(eventName, handler) {
        handlers.set(eventName, handler)
      },
    },
    isDestroyed: () => false,
    isVisible: () => visible,
    once(eventName, handler) {
      handlers.set(`once:${eventName}`, handler)
    },
    show() {
      visible = true
      lifecycleEvents.push('show')
    },
    maximize() {
      maximizeCalls += 1
      lifecycleEvents.push('maximize')
    },
    hide() {
      visible = false
    },
    navigate(url) {
      handlers.get('did-navigate')({}, url)
    },
    readyToShow() {
      handlers.get('once:ready-to-show')?.()
    },
    lifecycleEvents,
    get maximizeCalls() {
      return maximizeCalls
    },
  }
}

test('keeps login at the initial size and maximizes once after login', () => {
  const window = createWindowHarness()

  applyAuthenticatedWindowState({ window, allowedOrigin })
  window.navigate('https://picset.example.test/login?next=%2F')
  window.readyToShow()
  assert.equal(window.maximizeCalls, 0)

  window.navigate('https://picset.example.test/')
  window.navigate('https://picset.example.test/short-drama')
  window.navigate('https://picset.example.test/login')
  assert.equal(window.maximizeCalls, 1)
})

test('defers an authenticated startup maximize until ready to show', () => {
  const window = createWindowHarness()

  applyAuthenticatedWindowState({ window, allowedOrigin })
  window.navigate('https://picset.example.test/')
  assert.equal(window.maximizeCalls, 0)

  window.readyToShow()
  assert.equal(window.maximizeCalls, 1)
  assert.deepEqual(window.lifecycleEvents, ['show', 'maximize'])
})

test('maximizes after login even when the shown login window is hidden', () => {
  const window = createWindowHarness()

  applyAuthenticatedWindowState({ window, allowedOrigin })
  window.navigate('https://picset.example.test/login')
  window.readyToShow()
  window.hide()
  window.navigate('https://picset.example.test/')

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
