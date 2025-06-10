// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config")

module.exports = (() => {
  const config = getDefaultConfig(__dirname)

  // 1) Разрешаем Metro обрабатывать файлы .cjs
  config.resolver.sourceExts.push("cjs")

  // 2) Отключаем строгую проверку package.exports (иначе не найдёт Firebase Auth)
  config.resolver.unstable_enablePackageExports = false

  return config
})()
