import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.js'

// Create different limiteer for tiers
const freeLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:free',
    points: 30,
    duration: 900,
    blockDuration: 900
});

const premiumLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:premium',
    points: 200,
    duration: 900,
    blockDuration: 0,
});

const rateLimiter = async ( req, res, next) => {
    try {
        const tier = req.user?.tier?.plan || 'free';
        const limiter = tier === 'premium' ? premiumLimiter : freeLimiter;

        await limiter.consume(req.ip);

        next();
        
    } catch (error) {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Upgrade  t o Premium for higher limits'
        });
    }
};

export default rateLimiter;