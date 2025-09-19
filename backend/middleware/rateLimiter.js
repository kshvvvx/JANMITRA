const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { Redis } = require('ioredis');
const { createClient } = require('redis');

// Initialize Redis client
const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    })
  : null;

// Error handler for Redis connection
redisClient?.on('error', (err) => {
  console.error('Redis error:', err);
});

// Fallback to in-memory store if Redis is not available
const store = redisClient 
  ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    })
  : new rateLimit.MemoryStore();

// Common rate limit message
const rateLimitMessage = {
  success: false,
  error: 'Rate limit exceeded. Please try again later.'
};

// Common rate limit handler
const rateLimitHandler = (req, res) => {
  res.status(429).json(rateLimitMessage);
};

/**
 * Authentication rate limiter (5 requests per 10 minutes per IP)
 * For login/OTP routes
 */
const authLimiter = rateLimit.rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `auth:${req.ip}`;
  }
});

/**
 * Complaint submission limiter (20 requests per hour per user)
 * For POST /complaints and POST /complaints/:id/refile
 */
const complaintLimiter = rateLimit.rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `complaint:${req.user?._id || req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for staff/supervisor users
    return req.user?.role === 'staff' || req.user?.role === 'supervisor';
  }
});

/**
 * Supervisor escalation limiter (10 escalations per week per user)
 * For POST /complaints/:id/escalate
 */
const supervisorLimiter = rateLimit.rateLimit({
  windowMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `escalate:${req.user?._id || req.ip}`;
  }
});

/**
 * General rate limiter (100 requests per 15 minutes per IP)
 * Applied globally to all routes
 */
const generalLimiter = rateLimit.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return `general:${req.user?._id || req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for these paths
    const skipPaths = ['/health', '/metrics', '/favicon.ico'];
    return skipPaths.includes(req.path);
  }
});

module.exports = {
  authLimiter,
  complaintLimiter,
  supervisorLimiter,
  generalLimiter,
  // Export Redis client for graceful shutdown
  redisClient
};
