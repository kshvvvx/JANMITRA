// Configuration for different environments
export const CONFIG = {
  // Development configuration
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    AI_SERVICE_URL: 'http://localhost:5001',
  },
  
  // Production configuration
  production: {
    API_BASE_URL: 'https://your-backend-domain.com/api', // Replace with actual production URL
    AI_SERVICE_URL: 'https://your-ai-service-domain.com',
  },
  
  // Staging configuration
  staging: {
    API_BASE_URL: 'https://staging-backend.your-domain.com/api',
    AI_SERVICE_URL: 'https://staging-ai.your-domain.com',
  }
};

// Get current environment
const getEnvironment = () => {
  // In Expo, __DEV__ is available to check if in development
  if (__DEV__) {
    return 'development';
  }
  
  // You can also check for other environment indicators
  // For example, if you set an environment variable in your build
  return process.env.NODE_ENV === 'production' ? 'production' : 'staging';
};

// Export current configuration
export const CURRENT_CONFIG = CONFIG[getEnvironment()];

// Export individual values for convenience
export const API_BASE_URL = CURRENT_CONFIG.API_BASE_URL;
export const AI_SERVICE_URL = CURRENT_CONFIG.AI_SERVICE_URL;
