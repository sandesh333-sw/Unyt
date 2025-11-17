const redis = require('../config/redis');

class CacheService {
  // Get from cache
  static async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  // Set in cache
  static async set(key, value, ttl = 3600) {
    try {
      return await redis.setex(key, ttl, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  // Delete from cache
  static async del(key) {
    try {
      return await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  // Clear pattern
  static async clearPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        return await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  }
  
  // Cache wrapper for functions
  static async cached(key, fn, ttl = 3600) {
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await fn();
    await this.set(key, JSON.stringify(result), ttl);
    return result;
  }
}

module.exports = CacheService;