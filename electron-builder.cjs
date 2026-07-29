const { resolveSigningConfiguration } = require('./src/signing-config.cjs')
const { skipNodeModuleHandling } = require('./src/packaging-policy.cjs')

const packageMetadata = require('./package.json')

const signing = resolveSigningConfiguration(process.env)

module.exports = {
  appId: 'com.picset.desktop',
  productName: 'PicSet Desktop',
  directories: {
    output: 'release',
  },
  asar: true,
  beforeBuild: () => skipNodeModuleHandling(packageMetadata),
  files: [
    'src/**/*',
    'package.json',
  ],
  extraResources: [
    {
      from: 'build/generated/runtime-config.json',
      to: 'runtime-config.json',
    },
  ],
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  forceCodeSigning: signing.macSigned || signing.windowsSigned,
  mac: {
    category: 'public.app-category.productivity',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    hardenedRuntime: signing.macSigned,
    gatekeeperAssess: false,
    ...(signing.macSigned
      ? {
        entitlements: 'build/entitlements.mac.plist',
        entitlementsInherit: 'build/entitlements.mac.inherit.plist',
      }
      : {}),
  },
  ...(signing.macSigned ? { afterSign: 'scripts/notarize.cjs' } : {}),
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
}
