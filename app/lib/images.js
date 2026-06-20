// Listings now store an `images` array ([{ url, publicId }]). Older listings
// created before that change only have the legacy single `imageUrl` /
// `imagePublicId` fields. This helper returns a consistent images array for
// either shape so the rest of the app never has to branch on it.
//
// Pure JS (no server-only imports) so it's safe in both Server and Client
// Components.
export function normalizeListingImages(listing) {
    if (Array.isArray(listing?.images) && listing.images.length > 0) {
        return listing.images;
    }

    if (listing?.imageUrl) {
        return [{ url: listing.imageUrl, publicId: listing.imagePublicId || null }];
    }

    return [];
}

// Convenience: the cover image used in cards and previews.
export function getCoverImage(listing) {
    return normalizeListingImages(listing)[0]?.url || null;
}
