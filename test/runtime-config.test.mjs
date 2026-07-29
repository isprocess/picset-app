import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import runtimeConfig from '../src/runtime-config.cjs'
import { generateRuntimeConfig } from '../scripts/generate-runtime-config.mjs'

const {
  RuntimeConfigError,
  buildRuntimeConfig,
  loadRuntimeConfig,
  normalizeDesktopWebUrl,
  resolveRuntimeConfigPath,
} = runtimeConfig

test('normalizes a root HTTPS origin', () => {
  assert.equal(
    normalizeDesktopWebUrl('https://picset.example.test/'),
    'https://picset.example.test',
  )
})

for (const value of [
  '',
  'http://picset.example.test',
  'https://user:password@picset.example.test',
  'https://picset.example.test/path',
  'https://picset.example.test?source=test',
  'https://picset.example.test#section',
  'not a URL',
]) {
  test(`rejects invalid desktop URL: ${JSON.stringify(value)}`, () => {
    assert.throws(
      () => normalizeDesktopWebUrl(value),
      (error) => error instanceof RuntimeConfigError
        && error.code === 'PICSET_DESKTOP_CONFIG_INVALID',
    )
  })
}

test('buildRuntimeConfig has exactly one field', () => {
  assert.deepEqual(
    buildRuntimeConfig('https://picset.example.test'),
    { webUrl: 'https://picset.example.test' },
  )
})

test('generator writes only the validated URL', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'picset-runtime-config-'))
  const outputPath = join(directory, 'runtime-config.json')

  await generateRuntimeConfig({
    inputUrl: 'https://picset.example.test',
    outputPath,
  })

  assert.deepEqual(
    JSON.parse(await readFile(outputPath, 'utf8')),
    { webUrl: 'https://picset.example.test' },
  )
})

test('reader rejects an unexpected field', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'picset-runtime-config-'))
  const filePath = join(directory, 'runtime-config.json')

  await writeFile(
    filePath,
    JSON.stringify({ webUrl: 'https://picset.example.test', token: 'forbidden' }),
  )

  assert.throws(
    () => loadRuntimeConfig(filePath),
    (error) => error instanceof RuntimeConfigError
      && error.code === 'PICSET_DESKTOP_CONFIG_INVALID',
  )
})

test('resolves packaged and development paths', () => {
  assert.equal(
    resolveRuntimeConfigPath({
      isPackaged: true,
      resourcesPath: '/installed/resources',
      appPath: '/workspace/picset-desktop',
    }),
    join('/installed/resources', 'runtime-config.json'),
  )
  assert.equal(
    resolveRuntimeConfigPath({
      isPackaged: false,
      resourcesPath: '/ignored',
      appPath: '/workspace/picset-desktop',
    }),
    join('/workspace/picset-desktop', 'build', 'generated', 'runtime-config.json'),
  )
})
