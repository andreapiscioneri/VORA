const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
// apps/mobile -> apps -> repo root -> packages/shared
const repoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.resolve(repoRoot, 'packages/shared'), path.resolve(repoRoot, 'node_modules')]
// zod (a dependency of the shared validation schemas, not of this app) lives
// only in the workspace root's node_modules, hoisted there for apps/web by
// yarn workspaces — apps/mobile isn't a yarn workspace member (it manages
// its own deps via npm, see AGENTS.md), so it needs an explicit path to it.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(repoRoot, 'node_modules')]
// The shared validation schemas import their sibling types via `~/shared/...`
// (a Nuxt alias that resolves for apps/web through its `shared` symlink) —
// mirror it here so the same source resolves for Metro too.
config.resolver.extraNodeModules = { '~': path.resolve(repoRoot, 'packages') }

module.exports = config
