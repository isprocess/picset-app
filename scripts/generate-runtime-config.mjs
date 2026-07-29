import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import runtimeConfig from '../src/runtime-config.cjs'

const { buildRuntimeConfig } = runtimeConfig
const defaultOutputPath = resolve(
  fileURLToPath(new URL('../build/generated/runtime-config.json', import.meta.url)),
)

export async function generateRuntimeConfig({
  inputUrl = process.env.PICSET_DESKTOP_WEB_URL,
  outputPath = defaultOutputPath,
} = {}) {
  const config = buildRuntimeConfig(inputUrl)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  return outputPath
}

const invokedAsScript = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedAsScript) {
  generateRuntimeConfig()
    .then(() => console.log('Generated desktop runtime configuration.'))
    .catch(() => {
      console.error('PICSET_DESKTOP_WEB_URL must be a valid HTTPS root origin.')
      process.exitCode = 1
    })
}
