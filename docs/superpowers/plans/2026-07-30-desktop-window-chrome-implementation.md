# Desktop Window Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Electron's stock application menu and maximize the desktop window once the user reaches an authenticated PicSet page.

**Architecture:** Keep all decisions in the Electron main process. A small application-menu policy suppresses the default menu, while a window-state policy listens for completed main-frame navigation and maximizes once a same-origin URL leaves `/login`.

**Tech Stack:** Electron 43, CommonJS main-process modules, Node.js built-in test runner.

## Global Constraints

- Work directly on `main`; do not create a branch or worktree.
- Keep the login page at the existing 1440 by 900 initial size.
- Do not add preload code, IPC, DOM inspection, authentication requests, or a Node proxy.
- Do not commit service URLs, credentials, generated runtime configuration, or package artifacts.

---

### Task 1: Suppress the Default Application Menu

**Files:**
- Create: `src/application-menu-policy.cjs`
- Create: `test/application-menu-policy.test.mjs`
- Modify: `src/main.cjs`

**Interfaces:**
- Consumes: Electron's `Menu` module.
- Produces: `removeDefaultApplicationMenu(menu)`.

- [x] **Step 1: Write the failing menu policy test**

```js
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
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node test/application-menu-policy.test.mjs`

Expected: FAIL because `src/application-menu-policy.cjs` does not exist.

- [x] **Step 3: Implement and wire the menu policy**

```js
function removeDefaultApplicationMenu(menu) {
  menu.setApplicationMenu(null)
}

module.exports = { removeDefaultApplicationMenu }
```

Import `Menu` and call `removeDefaultApplicationMenu(Menu)` after
`app.whenReady()` resolves and before `createMainWindow()`.

- [x] **Step 4: Run focused and full tests**

Run: `node test/application-menu-policy.test.mjs && npm test`

Expected: all tests pass.

- [x] **Step 5: Commit**

```bash
git add src/application-menu-policy.cjs test/application-menu-policy.test.mjs src/main.cjs
git commit -m "feat: remove default desktop menu"
```

---

### Task 2: Maximize After Authenticated Navigation

**Files:**
- Create: `src/window-state-policy.cjs`
- Create: `test/window-state-policy.test.mjs`
- Modify: `src/main.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: a `BrowserWindow`, its `webContents` navigation events, and the validated allowed origin.
- Produces: `applyAuthenticatedWindowState({ window, allowedOrigin })` and `shouldMaximizeForNavigation(rawUrl, allowedOrigin)`.

- [x] **Step 1: Write failing policy tests**

```js
import assert from 'node:assert/strict'
import test from 'node:test'

import windowStatePolicy from '../src/window-state-policy.cjs'

const {
  applyAuthenticatedWindowState,
  shouldMaximizeForNavigation,
} = windowStatePolicy
const allowedOrigin = 'https://picset.example.test'

function createWindowHarness({ visible = true } = {}) {
  const handlers = new Map()
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
    maximize() {
      maximizeCalls += 1
    },
    navigate(url) {
      handlers.get('did-navigate')({}, url)
    },
    readyToShow() {
      visible = true
      handlers.get('once:ready-to-show')?.()
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

test('defers an authenticated startup maximize until ready to show', () => {
  const window = createWindowHarness({ visible: false })
  applyAuthenticatedWindowState({ window, allowedOrigin })
  window.navigate('https://picset.example.test/')
  assert.equal(window.maximizeCalls, 0)
  window.readyToShow()
  assert.equal(window.maximizeCalls, 1)
})

test('rejects invalid and cross-origin navigation', () => {
  assert.equal(shouldMaximizeForNavigation('not a URL', allowedOrigin), false)
  assert.equal(
    shouldMaximizeForNavigation('https://docs.example.test/', allowedOrigin),
    false,
  )
})
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node test/window-state-policy.test.mjs`

Expected: FAIL because `src/window-state-policy.cjs` does not exist.

- [x] **Step 3: Implement and wire the window-state policy**

```js
const { normalizeDesktopWebUrl } = require('./runtime-config.cjs')

function shouldMaximizeForNavigation(rawUrl, allowedOrigin) {
  let target
  try {
    target = new URL(rawUrl)
  } catch {
    return false
  }
  return target.origin === normalizeDesktopWebUrl(allowedOrigin)
    && target.pathname !== '/login'
}

function applyAuthenticatedWindowState({ window, allowedOrigin }) {
  let hasMaximized = false

  window.webContents.on('did-navigate', (_event, url) => {
    if (hasMaximized || window.isDestroyed()) return
    if (!shouldMaximizeForNavigation(url, allowedOrigin)) return

    hasMaximized = true
    if (window.isVisible()) {
      window.maximize()
      return
    }

    window.once('ready-to-show', () => {
      if (!window.isDestroyed()) window.maximize()
    })
  })
}

module.exports = {
  applyAuthenticatedWindowState,
  shouldMaximizeForNavigation,
}
```

In `src/main.cjs`, call the policy immediately after constructing the
`BrowserWindow` and before `loadURL()`:

```js
applyAuthenticatedWindowState({
  window,
  allowedOrigin: desktopConfig.webUrl,
})
```

- [x] **Step 4: Document the visible behavior**

Add README architecture bullets stating that the stock Electron menu is absent,
the login page uses the initial window size, and authenticated content is
maximized once.

- [x] **Step 5: Run focused and full verification**

Run: `node test/window-state-policy.test.mjs && npm test && git diff --check`

Expected: all tests pass and the diff check is clean.

- [x] **Step 6: Commit**

```bash
git add src/window-state-policy.cjs test/window-state-policy.test.mjs src/main.cjs README.md
git commit -m "feat: maximize desktop after login"
```
