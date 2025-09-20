const config = require('config');
const path = require('path');

// Load configuration from config directory
const defaultConfig = require('./default');

// Merge with environment-specific config if it exists
try {
  const envConfig = require(`./${process.env.NODE_ENV || 'development'}`);
  module.exports = { ...defaultConfig, ...envConfig };
} catch (error) {
  // If environment-specific config doesn't exist, use default
  module.exports = defaultConfig;
}
