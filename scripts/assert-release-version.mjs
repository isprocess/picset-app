import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function releaseVersionError(message, code) {
  const error = new Error(message)
  error.code = code
  return error
}

export function assertReleaseVersion({ tag, version }) {
  if (typeof tag !== 'string' || tag === '') {
    throw releaseVersionError(
      'RELEASE_TAG is required.',
      'PICSET_DESKTOP_RELEASE_TAG_MISSING',
    )
  }

  if (tag !== `v${version}`) {
    throw releaseVersionError(
      'Release tag does not match package.json version.',
      'PICSET_DESKTOP_RELEASE_VERSION_MISMATCH',
    )
  }
}

async function main() {
  const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url))
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

  assertReleaseVersion({
    tag: process.env.RELEASE_TAG,
    version: packageJson.version,
  })

  console.log('Release tag matches package version.')
}

const invokedAsScript = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedAsScript) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
