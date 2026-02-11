import { RateLimiterMemory } from "rate-limiter-flexible";

// Create rate limiters for different operations
const rateLimiters = {
    // General API calls - 100 requests per 15 minutes
    api: new RateLimiterMemory({
        points: 100,
        duration: 900, //15 minutes
    }),

    // Create listing - 2 per 24 hour
    createListing: new RateLimiterMemory({
        points: 2,
        duration: 86400,
    }),

    // Update/Delete - 5 per hour
    modifyListing: new RateLimiterMemory({
        points: 5,
        duration: 3600,
    }),

    // Search - 50 per hour
    search: new RateLimiterMemory({
        points: 50,
        duration: 300,
    }),
};

export async function checkRateLimit(identifier, type='api'){
    const limiter = rateLimiters[type] || rateLimiters.api;

    try {
    await limiter.consume(identifier);
    return { allowed: true };
        
    } catch (error) {
        return {
            allowed: false,
            retryAfter: Math.round(error.msBeforeNext / 1000) || 60,
        };
    }
}