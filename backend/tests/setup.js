const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { redisClient } = require('../middleware/rateLimiter');

let mongoServer;
let mongoUri;
let app;
let server;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.OTP_SECRET = 'test-otp-secret';
process.env.OTP_EXPIRES_IN = '5m';
process.env.JWT_EXPIRES_IN = '1d';
process.env.REDIS_URL = 'redis://localhost:6379'; // Use local Redis for testing

// Mock OTP service
jest.mock('../services/otpService', () => ({
  generateOTP: jest.fn().mockReturnValue('123456'),
  verifyOTP: jest.fn().mockResolvedValue(true),
  generateOTPToken: jest.fn().mockReturnValue('mocked-otp-token')
}));

// Mock push notification service
jest.mock('../services/notificationService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(true),
  registerPushToken: jest.fn().mockResolvedValue(true)
}));

// Mock Redis client for testing
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  return jest.fn(() => new RedisMock());
});

beforeAll(async () => {
  try {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear Redis before tests
    if (redisClient) {
      await redisClient.flushall();
    }
    
    // Import and start the Express app after DB connection
    const appModule = require('../app');
    app = appModule.app;
    
    // Only start the server if not already started
    if (!server || !server.listening) {
      server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      const address = server.address();
      process.env.TEST_BASE_URL = `http://localhost:${address.port}`;
    }
});

afterAll(async () => {
  // Close server and database connection
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  
  await mongoose.disconnect();
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
  }
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Helper function to reset rate limiters between tests
const resetRateLimiters = async () => {
  if (redisClient) {
    await redisClient.flushall();
  }
};

module.exports = {
  app,
  server,
  mongoUri,
  resetRateLimiters
};
