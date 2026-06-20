import connectDB from "@/app/lib/mongodb";
import Listing from "@/app/models/Listing";
import { cache } from "@/app/lib/redis";
import { searchQuerySchema } from "@/app/lib/validations";
import { idSchema } from "@/app/lib/validations";
import { sanitizeObject } from "@/app/lib/sanitize";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/app/lib/constants";

// Mongoose documents aren't directly serializable (ObjectId, Date, etc.) and
// can't be passed from a Server Component to a Client Component as-is. Round
// tripping through JSON gives us plain objects whose shape is identical to what
// the Redis cache stores, so cache hits and fresh DB reads look the same.
function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

// Clamp/normalize untrusted page + limit values.
function normalizePaging(page, limit) {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && limit >= 1
      ? Math.min(Math.floor(limit), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { safePage, safeLimit };
}

function emptyPage(page, limit) {
  return {
    listings: [],
    total: 0,
    page,
    limit,
    totalPages: 1,
    hasMore: false,
  };
}

/**
 * Fetch a page of listings, newest first, optionally filtered by a search term.
 *
 * Reads from Redis first and falls back to MongoDB on a miss. Each (search,
 * page, limit) combination is cached under its own key; writes invalidate the
 * whole `listings:*` namespace so new/edited listings show up immediately.
 *
 * @param {{ search?: string, page?: number, limit?: number }} [options]
 * @returns {Promise<{ listings: object[], total: number, page: number, limit: number, totalPages: number, hasMore: boolean }>}
 */
export async function getListings({ search = "", page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  const { safePage, safeLimit } = normalizePaging(page, limit);
  const trimmed = (search || "").trim();

  // Validate + sanitize the search term exactly like the REST API does so both
  // entry points share the same cache keys.
  let cleanSearch = "";
  if (trimmed) {
    if (!searchQuerySchema.safeParse({ search: trimmed }).success) {
      return emptyPage(safePage, safeLimit);
    }
    cleanSearch = sanitizeObject({ search: trimmed }).search;
  }

  const base = cleanSearch ? `listings:search:${cleanSearch}` : "listings:all";
  const cacheKey = `${base}:p${safePage}:l${safeLimit}`;

  // Cached payload holds the page of listings plus the total count for this query.
  let payload = await cache.get(cacheKey);

  if (!payload) {
    // connectDB() returns null during the production build phase; bail out with
    // an empty page rather than querying a connection that doesn't exist.
    const conn = await connectDB();
    if (!conn) return emptyPage(safePage, safeLimit);

    // NOTE: search uses an unindexed case-insensitive $regex (full collection
    // scan). Fine at current scale; revisit with a MongoDB text index or Atlas
    // Search if the catalogue grows large.
    const query = cleanSearch
      ? {
          $or: [
            { title: { $regex: cleanSearch, $options: "i" } },
            { description: { $regex: cleanSearch, $options: "i" } },
            { location: { $regex: cleanSearch, $options: "i" } },
            { country: { $regex: cleanSearch, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Listing.countDocuments(query),
    ]);

    payload = { listings: toPlain(items), total };
    await cache.set(cacheKey, payload, 300);
  }

  const totalPages = Math.max(1, Math.ceil(payload.total / safeLimit));

  return {
    listings: payload.listings,
    total: payload.total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasMore: safePage < totalPages,
  };
}

/**
 * Fetch a single listing by id.
 *
 * @param {string} id
 * @returns {Promise<object|null>} the listing, or null if the id is invalid or no match exists
 */
export async function getListingById(id) {
  if (!idSchema.safeParse(id).success) return null;

  const cacheKey = `listing:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const conn = await connectDB();
  if (!conn) return null;

  const doc = await Listing.findById(id).lean();
  if (!doc) return null;

  const listing = toPlain(doc);
  await cache.set(cacheKey, listing, 600);
  return listing;
}
