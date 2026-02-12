import { cache } from "./redis";

async function checkRateLimit(identifier, type = 'api') {
    const limits = {
        api: { points: 50, duration: 900 }, // 50 req / 15 min
        createListing: { points: 2, duration: 86400 }, // 2 req / 24 hour
        modifyListing: { points: 10, duration: 3600 }, // 10 req / 1 hour
        search: { points: 10, duration: 3600 },         // 10 req / 1 hour
    };

    const limit = limits[type] || limits.api;
    const key = `ratelimit:${type}:${identifier}`;

    try {

        // Get current count from Redis
        const current = await cache.get(key);

        if (!current) {
            // First request - set count to 1 with expiry
            await cache.set(key, { count: 1, firstRequest: Date.now() }, limit.duration);
            return { allowed: true, remaining: limit.points - 1 };
        }

        if (current.count >= limit.points) {
            // Get TTL to tell client when to retry
            return {
                allowed: false,
                retryAfter: limit.duration,
            };
        }

        // Increment count
        await cache.set(key, { ...current, count: current.count + 1 }, limit.duration);
        return { allowed: true, remaining: limit.points - current.count - 1 };


    } catch (error) {
        // If redis is down, fail open (allow request) to avoid blocking users
        console.error('Rate limiter error:', error);
        return { allowed: true };
    }
}

export { checkRateLimit };