const Redis = require('ioredis');
const logger = require('../config/logger');

class Cache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initialize();
  }

  initialize() {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not set, using in-memory cache (not suitable for production)');
      this.client = new Map(); // Fallback to in-memory cache
      return;
    }

    try {
      this.client = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis client connected');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.client = new Map(); // Fallback to in-memory cache
    }
  }

  async get(key) {
    try {
      if (!this.isConnected && !(this.client instanceof Map)) return null;
      
      if (this.client instanceof Map) {
        const item = this.client.get(key);
        if (!item) return null;
        return JSON.parse(item);
      }

      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlInSeconds = 60) {
    try {
      if (!this.isConnected && !(this.client instanceof Map)) return false;
      
      const stringValue = JSON.stringify(value);
      
      if (this.client instanceof Map) {
        this.client.set(key, stringValue);
        if (ttlInSeconds > 0) {
          setTimeout(() => this.client.delete(key), ttlInSeconds * 1000);
        }
        return true;
      }

      if (ttlInSeconds > 0) {
        await this.client.setex(key, ttlInSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  async del(keyPattern) {
    try {
      if (!this.isConnected && !(this.client instanceof Map)) return 0;

      if (this.client instanceof Map) {
        if (keyPattern.endsWith('*')) {
          const prefix = keyPattern.slice(0, -1);
          let count = 0;
          for (const key of this.client.keys()) {
            if (key.startsWith(prefix)) {
              this.client.delete(key);
              count++;
            }
          }
          return count;
        }
        return this.client.delete(keyPattern) ? 1 : 0;
      }

      if (keyPattern.includes('*')) {
        const keys = await this.client.keys(keyPattern);
        if (keys.length === 0) return 0;
        await this.client.del(keys);
        return keys.length;
      }
      
      const result = await this.client.del(keyPattern);
      return result;
    } catch (error) {
      logger.error(`Error deleting cache for pattern ${keyPattern}:`, error);
      return 0;
    }
  }

  async flush() {
    try {
      if (this.client instanceof Map) {
        this.client.clear();
        return true;
      }
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error);
      return false;
    }
  }
}

// Export a singleton instance
const cache = new Cache();
module.exports = cache;
