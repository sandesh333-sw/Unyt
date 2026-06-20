# Unyt

A housing marketplace for students. Browse listings, search by location, view a
property on a map, and — once signed in — post, edit, and delete your own
listings.

Built with the Next.js App Router, MongoDB, and Redis, and shipped as a
standalone Docker image to Kubernetes via GitHub Actions.

## Stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19)                 |
| Database       | MongoDB via Mongoose                              |
| Cache          | Redis (ioredis)                                   |
| Auth           | Clerk                                             |
| Image hosting  | Cloudinary                                        |
| Maps/geocoding | Mapbox                                            |
| Styling        | Tailwind CSS v4                                    |
| Deployment     | Docker (standalone output) → Kubernetes           |

## How rendering and caching work

The pages that show listings — the home page, the listings index, and the
listing detail page — are **React Server Components**. They read data on the
server through a small data-access layer ([`app/lib/listings.js`](app/lib/listings.js))
and send fully-rendered HTML to the browser. There's no client-side fetch
waterfall and no loading spinner on first paint.

That data layer is also where caching lives:

```
Server Component ─► getListings() / getListingById()
                        │
                        ├─ Redis hit  ─► return cached JSON
                        └─ Redis miss ─► query MongoDB ─► cache result ─► return
```

- Lists are cached under `listings:all` (or `listings:search:<term>` for a
  search) for 5 minutes; single listings under `listing:<id>` for 10 minutes.
- Writes (`POST`/`PUT`/`DELETE`) invalidate the relevant keys, so edits show up
  immediately rather than waiting for a TTL.
- Geocoding results are cached for 30 days, since a location's coordinates don't
  change.

The same listings are also exposed as a JSON REST API under
[`app/api/listings`](app/api/listings) for programmatic access and for the
authenticated write operations. The API and the Server Components share the same
Redis keys, so they stay consistent.

### Why it's structured this way

The bottleneck in a data-driven page is rarely the database query — it's the
round trips. Fetching on the client means: download an HTML shell, download the
JS bundle, hydrate, *then* make an API call, *then* render. Moving the fetch to
the server collapses that into a single server render that hits Redis directly.
Redis caching only pays off once the request that uses it isn't stuck behind
that waterfall.

## Project structure

```
app/
  page.js                     Home (hero + featured listings)
  layout.js                   Root layout: ClerkProvider, navbar, footer
  (main)/                     Hero, navbar, footer, featured sections
  (auth)/                     Clerk sign-in / sign-up routes
  (listing)/
    listings/                 Listings index (server-rendered, ?search aware)
    listings/[id]/            Listing detail, edit page, map, delete button
    post-listing/             Create-listing form
  api/listings/               REST API (GET list/detail, POST/PUT/DELETE)
  components/ListingCard.jsx  Shared listing card
  lib/
    listings.js               Server-side data access + caching
    mongodb.js                Cached Mongoose connection
    redis.js                  Redis client + cache helpers
    rateLimiter.js            Redis-backed rate limiting
    geocoding.js              Mapbox geocoding (cached)
    sanitize.js               Input sanitization
    validations.js            Zod schemas
  models/Listing.js           Listing schema
middleware.js                 Clerk auth: public reads, protected writes
k8s/                          Deployment, service, ingress, HPA
Dockerfile                    Multi-stage build → standalone runtime
```

## Getting started

Requires Node 20+, plus a MongoDB and a Redis instance (local or hosted).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` (see below).

3. Run the dev server:

   ```bash
   npm run dev
   ```

   The app runs at http://localhost:3000.

If `REDIS_URL` is unset the app still works — it just logs that caching is
disabled and reads straight from MongoDB.

## Environment variables

| Variable                             | Used for                          | Public |
| ------------------------------------ | --------------------------------- | :----: |
| `MONGODB_URI`                        | MongoDB connection string         |        |
| `REDIS_URL`                          | Redis connection string           |        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk (client)                    |   ✓    |
| `CLERK_SECRET_KEY`                   | Clerk (server)                    |        |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`  | Cloudinary uploads                |   ✓    |
| `CLOUDINARY_API_KEY`                 | Cloudinary (server)               |        |
| `CLOUDINARY_API_SECRET`              | Cloudinary (server)               |        |
| `NEXT_PUBLIC_MAPBOX_TOKEN`           | Maps + geocoding                  |   ✓    |
| `NEXT_PUBLIC_BASE_URL`               | Absolute URLs                     |   ✓    |

`NEXT_PUBLIC_*` values are baked in at build time; in Docker they're passed as
build args (see the `Dockerfile`). The rest are read at runtime.

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the dev server         |
| `npm run build` | Production build (standalone)|
| `npm start`     | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## Deployment

The `Dockerfile` is a three-stage build (deps → build → runtime) that produces
Next.js standalone output and runs as a non-root user on port 3000.

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... \
  --build-arg NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=... \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=... \
  --build-arg NEXT_PUBLIC_BASE_URL=... \
  -t unyt .
```

On push to `main`, [`.github/workflows/cicd.yaml`](.github/workflows/cicd.yaml)
runs tests, bumps the version tag, builds and pushes the image, and rolls out
the new version to Kubernetes. The manifests in [`k8s/`](k8s) cover the
deployment, service, ingress, and a horizontal pod autoscaler.

## Security notes

- `middleware.js` lets anyone read listings but requires authentication for any
  write, and protects all non-public routes.
- All user input is sanitized (`lib/sanitize.js`) and validated against Zod
  schemas (`lib/validations.js`) before it reaches the database.
- Write endpoints are rate-limited per user, and search is rate-limited per IP,
  using Redis counters that fail open if Redis is unavailable.
- Security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, etc.) are
  set in `next.config.mjs`.
