import assert from 'node:assert/strict'
import test from 'node:test'

import navigationPolicy from '../src/navigation-policy.cjs'

const { classifyNavigation } = navigationPolicy
const allowedOrigin = 'https://picset.example.test'

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
