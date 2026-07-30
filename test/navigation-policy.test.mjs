import assert from 'node:assert/strict'
import test from 'node:test'

import navigationPolicy from '../src/navigation-policy.cjs'

const { applyNavigationPolicy, classifyNavigation } = navigationPolicy
const allowedOrigin = 'https://picset.example.test'

function createWebContentsHarness() {
  const handlers = new Map()

  return {
    handlers,
    on(eventName, handler) {
      handlers.set(eventName, handler)
    },
    setWindowOpenHandler(handler) {
      handlers.set('window-open', handler)
    },
  }
}

test('allows same-origin navigation', () => {
  assert.deepEqual(
    classifyNavigation('https://picset.example.test/short-drama', allowedOrigin),
    {
      kind: 'same-origin',
      url: 'https://picset.example.test/short-drama',
    },
  )
})

test('classifies external HTTPS as a system-browser link', () => {
  assert.deepEqual(
    classifyNavigation('https://docs.example.test/help', allowedOrigin),
    {
      kind: 'external',
      url: 'https://docs.example.test/help',
    },
  )
})

for (const value of [
  'http://docs.example.test',
  'mailto:help@example.test',
  'file:///etc/passwd',
  'https://user:password@docs.example.test',
  'not a URL',
]) {
  test(`denies unsafe navigation: ${JSON.stringify(value)}`, () => {
    assert.deepEqual(classifyNavigation(value, allowedOrigin), { kind: 'deny' })
  })
}

test('blocks a cross-origin main-frame server redirect', () => {
  const webContents = createWebContentsHarness()
  const externalUrls = []
  let prevented = false

  applyNavigationPolicy({
    webContents,
    allowedOrigin,
    openExternalUrl: (url) => externalUrls.push(url),
  })

  webContents.handlers.get('will-redirect')({
    url: 'https://docs.example.test/help',
    isMainFrame: true,
    preventDefault() {
      prevented = true
    },
  })

  assert.equal(prevented, true)
  assert.deepEqual(externalUrls, ['https://docs.example.test/help'])
})
