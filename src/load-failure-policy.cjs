function shouldShowLoadFailure({ errorCode, isMainFrame }) {
  return isMainFrame && errorCode !== -3
}

module.exports = { shouldShowLoadFailure }
