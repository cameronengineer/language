const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.resolver.assetExts.push('db', 'mp3', 'wav', 'json');
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Tree shaking and optimization
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Bundle splitting for performance
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    // Create stable module IDs for better caching
    return require('crypto').createHash('sha1').update(path).digest('hex').substr(0, 8);
  },
};

// Memory optimization
config.maxWorkers = 4;

// Asset optimization
config.transformer.enableBabelRCLookup = false;

module.exports = config;