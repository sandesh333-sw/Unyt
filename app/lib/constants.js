// Shared, framework-agnostic constants. Kept in their own module so both server
// code (validations, data layer) and client components can import them without
// pulling in server-only dependencies.

// Pagination
export const DEFAULT_PAGE_SIZE = 12; // fills the 3-column grid evenly
export const MAX_PAGE_SIZE = 50;     // hard cap so a client can't request the whole table

// Listing images
export const MAX_LISTING_IMAGES = 6;
