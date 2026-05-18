const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Handle Shared Workspace Folders
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, '../shared'),
  path.resolve(__dirname, 'node_modules'),
];

// 2. Add support for modern ESM packages
config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

module.exports = config;
