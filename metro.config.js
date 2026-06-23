const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;