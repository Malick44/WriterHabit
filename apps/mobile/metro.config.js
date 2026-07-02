const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const sharedPackageRoot = path.resolve(projectRoot, "../../packages/shared");

const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@": path.resolve(projectRoot, "src"),
  "@WriterHabit/shared": path.resolve(sharedPackageRoot, "src"),
  zod: path.resolve(projectRoot, "node_modules/zod"),
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(projectRoot, "../../node_modules"),
];

config.watchFolders = [
  ...(config.watchFolders ?? []),
  sharedPackageRoot,
];

module.exports = config;
