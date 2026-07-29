class PackagingPolicyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PackagingPolicyError'
    this.code = 'PICSET_DESKTOP_RUNTIME_DEPENDENCIES_UNSUPPORTED'
  }
}

function skipNodeModuleHandling(metadata) {
  const dependencies = metadata?.dependencies

  if (dependencies != null && Object.keys(dependencies).length > 0) {
    throw new PackagingPolicyError(
      'PicSet Desktop packages no runtime Node.js dependencies.',
    )
  }

  return false
}

module.exports = {
  PackagingPolicyError,
  skipNodeModuleHandling,
}
