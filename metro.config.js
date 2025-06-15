// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config")

module.exports = (() => {
  const config = getDefaultConfig(__dirname)

  // 1) Allow Metro to process .cjs files
  config.resolver.sourceExts.push("cjs")

  // 2) Disable strict package.exports checking (otherwise won't find Firebase Auth)
  config.resolver.unstable_enablePackageExports = false

  return config
})()
