const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Firebase JS SDK, Metro'nun package exports çözümlemesiyle uyumsuz olabiliyor.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
