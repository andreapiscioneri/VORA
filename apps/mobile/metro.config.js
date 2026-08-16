const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
// apps/mobile -> apps -> repo root -> packages/shared
const repoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.resolve(repoRoot, 'packages/shared')]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]

module.exports = config
