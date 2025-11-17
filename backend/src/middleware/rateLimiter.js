const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../config/redis');

// Create different limiters for tiers
const freeLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:free',
  points: 30, // requests
  duration: 900, // per 15 minutes
  blockDuration: 900
});

const premiumLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:premium',
  points: 200,
  duration: 900,
  blockDuration: 0 // No blocking for premium
});


exports.rateLimiter = async (req, res, next) => {
  try {
    const tier = req.user?.tier?.plan || 'free';
    const limiter = tier === 'premium' ? premiumLimiter : freeLimiter;
    
    await limiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Upgrade to Premium for higher limits'
    });
  }
};
const rateLimiter = async ( req, res, next) => {
    try {
        const tier = req.user?.tier?.plan || 'free';
        const limiter = tier === 'premium' ? premiumLimiter : freeLimiter;

        await limiter.consume(req.ip);

        next();
        
    } catch (error) {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Upgrade  to Premium for higher limits'
        });
    }
};

export default rateLimiter;
