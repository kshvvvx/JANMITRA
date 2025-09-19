const cache = require('../utils/cache');
const logger = require('../config/logger');

/**
 * Cache middleware for Express routes
 * @param {Function} keyBuilder - Function that generates cache key from request
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (keyBuilder, ttl = 60) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyBuilder(req);
      if (!cacheKey) {
        return next();
      }

      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Override res.json to cache the response before sending
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, body, ttl).catch(err => {
            logger.error('Failed to cache response:', err);
          });
        }
        return originalJson.call(res, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache for matching keys
 * @param {string|Function} keyOrBuilder - Cache key pattern or function that generates it from request
 * @returns {Function} Express middleware function
 */
const invalidateCache = (keyOrBuilder) => {
  return async (req, res, next) => {
    try {
      const keyPattern = typeof keyOrBuilder === 'function' 
        ? keyOrBuilder(req) 
        : keyOrBuilder;
      
      if (!keyPattern) {
        return next();
      }

      const count = await cache.del(keyPattern);
      logger.debug(`Invalidated ${count} cache entries matching: ${keyPattern}`);
      
      next();
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      next();
    }
  };
};

// Key builder functions for common routes
const keyBuilders = {
  staffComplaints: (req) => {
    const { status = 'unresolved', page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    const filters = JSON.stringify({ status, sort, order });
    return `complaints:staff:${filters}:${page}:${limit}`;
  },
  
  citizenComplaints: (req) => {
    if (!req.user?._id) return null;
    const { status } = req.query;
    return `complaints:citizen:${req.user._id}${status ? `:${status}` : ''}`;
  },
  
  nearbyComplaints: (req) => {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return null;
    return `complaints:nearby:${lat}:${lng}:${radius}`;
  },
  
  complaintDetails: (req) => {
    return `complaint:${req.params.id}`;
  }
};

// Cache invalidation patterns
const invalidationPatterns = {
  allComplaints: 'complaints:*',
  complaintById: (req) => `complaint:${req.params.id}`,
  userComplaints: (req) => `complaints:citizen:${req.user?._id}*`
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  keyBuilders,
  invalidationPatterns
};
