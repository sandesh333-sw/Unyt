// Thin logging shim. Today it's a console wrapper; it exists so the rest of the
// codebase can log through a single seam instead of scattering console.* calls.
//
// TODO(observability): wire this up for production.
//   - Send `error()` to an error tracker (e.g. Sentry: Sentry.captureException).
//   - Emit structured JSON (level, message, context, timestamp) so logs are
//     queryable, and add request/trace ids for correlation.
//   - Add lightweight metrics (cache hit/miss ratio, request latency) — the
//     "Cache HIT/MISS" console logs in the data/cache layers are placeholders
//     for real metrics.
//
// Usage: import { logger } from "@/app/lib/logger";
//        logger.error("Failed to fetch listings", { err });

const isProd = process.env.NODE_ENV === "production";

export const logger = {
    debug(...args) {
        if (!isProd) console.debug(...args);
    },
    info(...args) {
        console.info(...args);
    },
    warn(...args) {
        console.warn(...args);
    },
    error(...args) {
        // TODO: forward to error tracker here.
        console.error(...args);
    },
};

export default logger;
