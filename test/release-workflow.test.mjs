import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowPath = new URL(
  '../.github/workflows/release-desktop.yml',
  import.meta.url,
)

async function readReleaseWorkflow() {
  return readFile(workflowPath, 'utf8')
}

test('pins every GitHub Action to an immutable commit SHA', async () => {
  const workflow = await readReleaseWorkflow()
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

test('pins macOS package jobs to architecture-specific runner labels', async () => {
  const workflow = await readReleaseWorkflow()

  assert.doesNotMatch(workflow, /runner:\s+macos-latest/)
  assert.match(workflow, /id:\s+macos-x64[\s\S]*?runner:\s+macos-15-intel/)
  assert.match(workflow, /id:\s+macos-arm64[\s\S]*?runner:\s+macos-15/)
})

test('verifies macOS disk images before upload', async () => {
  const workflow = await readReleaseWorkflow()

  assert.match(workflow, /name:\s+Verify macOS disk images/)
  assert.match(workflow, /if:\s+startsWith\(matrix\.id, 'macos-'\)/)
  assert.match(workflow, /hdiutil verify/)
  assert.match(workflow, /hdiutil attach/)
})
