import assert from 'node:assert/strict'
import test from 'node:test'

import windowOptions from '../src/window-options.cjs'

const { createMainWindowOptions } = windowOptions

test('creates a sandboxed BrowserWindow without a preload bridge', () => {
  const options = createMainWindowOptions()

  assert.equal(options.width, 1440)
  assert.equal(options.height, 900)
  assert.equal(options.minWidth, 1024)
  assert.equal(options.minHeight, 700)
  assert.equal(options.show, false)
  assert.deepEqual(options.webPreferences, {
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    webSecurity: true,
  })
  assert.equal(Object.hasOwn(options.webPreferences, 'preload'), false)
  assert.equal(Object.hasOwn(options.webPreferences, 'enableRemoteModule'), false)
  assert.equal(Object.hasOwn(options.webPreferences, 'webviewTag'), false)
})
