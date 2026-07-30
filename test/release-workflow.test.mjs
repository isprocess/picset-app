import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowPath = new URL(
  '../.github/workflows/release-desktop.yml',
  import.meta.url,
)

test('pins every GitHub Action to an immutable commit SHA', async () => {
  const workflow = await readFile(workflowPath, 'utf8')
  const actionReferences = [
    ...workflow.matchAll(
      /^\s*- uses:\s+([^@\s]+)@([^\s#]+)(?:\s+#\s+(\S+))?\s*$/gm,
    ),
  ]

  assert.ok(actionReferences.length > 0)
  for (const [, action, ref, version] of actionReferences) {
    assert.match(ref, /^[0-9a-f]{40}$/, `${action} must use a full commit SHA`)
    assert.match(version ?? '', /^v\d/, `${action} must retain a version comment`)
  }
})
