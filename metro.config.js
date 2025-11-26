const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver aliases para plataforma web
config.resolver.resolverMainFields = ['browser', 'react-native', 'main'];

module.exports = config;
