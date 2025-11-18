const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../config/redis');

// Create different limiters for tiers (very lenient for development)
const freeLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:free',
  points: 1000, // requests
  duration: 60, // per 1 minute
  blockDuration: 0 // No blocking
});

const premiumLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:premium',
  points: 2000,
  duration: 60,
  blockDuration: 0 // No blocking for premium
});


exports.rateLimiter = async (req, res, next) => {
  // Skip rate limiting if Redis is not available or in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  try {
    const tier = req.user?.tier?.plan || 'free';
    const limiter = tier === 'premium' ? premiumLimiter : freeLimiter;
    
    await limiter.consume(req.ip);
    next();
  } catch (error) {
    // If Redis error, allow the request through
    if (error.message && error.message.includes('Redis')) {
      return next();
    }
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Upgrade to Premium for higher limits'
    });
  }
};
