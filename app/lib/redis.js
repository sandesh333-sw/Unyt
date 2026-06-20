import Redis from "ioredis";

let redis;

if (process.env.REDIS_URL){
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times){
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });


    redis.on('error', (err) => {
        console.error('Redis client error', err);
    });

    redis.on('connect', () => {
        console.log('Redis Client Connected');
    });
} else{
    console.warn('Redis URL not configured, caching disabled');
}

// Cache helper functions
export const cache = {
    async get(key){
        if (!redis) return null;

        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("Redis GET error:", error);
            return null;
        }
    },

    async set(key, value, expirationInSeconds = 300){
        if (!redis) return false;
        try {
            await redis.setex(key, expirationInSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Redis SET error', error);
            return false;
        }
    },

    async del(key){
        if (!redis) return false;
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.error('Redis DEL error', error);
            return false;
        }
    },

    async delPattern(pattern){
        if (!redis) return false;
        try {
            // Use SCAN instead of KEYS: KEYS is O(N) and blocks the whole Redis
            // server while it walks every key. SCAN iterates in small batches so
            // other clients aren't stalled. UNLINK frees the keys on a background
            // thread (non-blocking), falling back to DEL on older servers.
            let cursor = '0';
            do {
                const [next, keys] = await redis.scan(
                    cursor,
                    'MATCH', pattern,
                    'COUNT', 100
                );
                cursor = next;
                if (keys.length > 0){
                    await redis.unlink(...keys);
                }
            } while (cursor !== '0');
            return true;
        } catch (error) {
         console.error('Redis DEL PATTERN error:', error);
         return false;
        }
    },
};

export default redis;