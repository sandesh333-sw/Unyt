# Testing

> Status: not set up yet. This file is the plan so the work has a home. The CI
> pipeline already runs `npm test --if-present`, so adding a `test` script (and
> tests) will make it active without touching the workflow.

## Suggested setup

[Vitest](https://vitest.dev/) pairs well with a Next.js project:

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Add to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## What to cover first (highest value, least flaky)

Pure logic — no DB, no network:

- **`app/lib/images.js`** — `normalizeListingImages()` for: new `images[]` shape,
  legacy `imageUrl` fallback, and the empty case.
- **`app/lib/validations.js`** — `listingSchema` accepts a valid Cloudinary image
  array and rejects non-Cloudinary URLs / empty arrays / too many images;
  `paginationSchema` coerces and clamps `page`/`limit`.
- **`app/lib/sanitize.js`** — `sanitizeFields()` escapes text fields but leaves
  URLs untouched; `sanitizeObject()` preserves arrays.

Then, with a mocked Redis/Mongo (or a throwaway test DB):

- **`app/lib/listings.js`** — `getListings()` paging math (`totalPages`,
  `hasMore`), cache hit vs. miss, and the build-phase empty-page guard.
- **API routes** — pagination params, auth/ownership rejections, and cache
  invalidation on write.
