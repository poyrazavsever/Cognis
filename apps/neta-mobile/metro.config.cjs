const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

const workspaceAliases = new Map([
  ['@neta/api-contracts', path.join(monorepoRoot, 'packages/api-contracts/src/index.ts')],
  ['@neta/design-tokens', path.join(monorepoRoot, 'packages/design-tokens/src/index.ts')],
]);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = workspaceAliases.get(moduleName);

  if (alias) {
    return {
      filePath: alias,
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
