import redis from "./redis";

// Limits per action: points = allowed requests, duration = window in seconds.
const LIMITS = {
    api: { points: 50, duration: 900 },          // 50 req / 15 min
    createListing: { points: 2, duration: 86400 }, // 2 req / 24 hour
    modifyListing: { points: 10, duration: 3600 }, // 10 req / 1 hour
    search: { points: 10, duration: 3600 },        // 10 req / 1 hour
};

// Increment the counter and set its TTL in a single round trip. Doing this
// atomically server-side avoids the read-modify-write race where two concurrent
// requests both read the old count and under-count the window.
const INCR_AND_EXPIRE = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

async function checkRateLimit(identifier, type = 'api') {
    const limit = LIMITS[type] || LIMITS.api;
    const key = `ratelimit:${type}:${identifier}`;

    // No Redis configured (e.g. local dev) -> don't block anyone.
    if (!redis) return { allowed: true };

    try {
        const count = await redis.eval(INCR_AND_EXPIRE, 1, key, limit.duration);

        if (count > limit.points) {
            // Tell the client how long until the window resets.
            const ttl = await redis.ttl(key);
            return { allowed: false, retryAfter: ttl > 0 ? ttl : limit.duration };
        }

        return { allowed: true, remaining: Math.max(0, limit.points - count) };
    } catch (error) {
        // If Redis is down, fail open (allow request) rather than blocking users.
        console.error('Rate limiter error:', error);
        return { allowed: true };
    }
}

export { checkRateLimit };
