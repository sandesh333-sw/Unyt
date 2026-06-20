import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Listing from "@/app/models/Listing";
import { geocodeLocation } from "@/app/lib/geocoding";
import { cache } from "@/app/lib/redis";
import { requireAuth } from "@/app/lib/authMiddleware";
import { checkRateLimit } from "@/app/lib/rateLimiter";
import { listingSchema, idSchema } from "@/app/lib/validations";
import { sanitizeFields } from "@/app/lib/sanitize";
import { normalizeListingImages } from "@/app/lib/images";
import { deleteImages } from "@/app/lib/cloudinary";

// Free-text fields that get HTML-sanitized before storage.
const TEXT_FIELDS = ['title', 'description', 'location', 'country'];

// Prevent static optimization - this is a dynamic API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET: Get single listing with caching
export async function GET(request, { params }) {
  try {

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await checkRateLimit(ip, 'api');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }
        }
      )
    }

    await connectDB();

    const { id } = await params;

    // Validate ID
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID' },
        { status: 400 }
      );
    }


    const cacheKey = `listing:${id}`;

    // Try cache first
    const cachedListing = await cache.get(cacheKey);

    if (cachedListing) {
      console.log('Cache HIT:', cacheKey);
      return NextResponse.json({
        success: true,
        data: cachedListing,
        cached: true
      }, { status: 200 });
    }

    console.log('Cache MISS:', cacheKey);

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Cache for 10 minutes (600 seconds)
    await cache.set(cacheKey, listing, 600);

    return NextResponse.json(
      { success: true, data: listing, cached: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// PUT: Update listing
export async function PUT(request, { params }) {
  try {

    // Check authenthication
    const authResult = await requireAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const { userId } = authResult;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'modifyListing');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many modifications. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }
        }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate ID
    const isValidation = idSchema.safeParse(id);
    if (!isValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Checking if user owns the listing
    if (listing.owner != userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not own the listing' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate first (enforces Cloudinary image URLs), then sanitize free text.
    const validation = listingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        }, {
        status: 400
      }
      );
    }

    const clean = sanitizeFields(validation.data, TEXT_FIELDS);
    const { title, description, location, country, price, images } = clean;

    // Geocode (using the raw location) only if it actually changed.
    let geometry = listing.geometry;
    if (clean.location !== listing.location) {
      geometry = await geocodeLocation(validation.data.location);
    }

    // Work out which previously-stored images the user removed, so we can clean
    // them up in Cloudinary after the DB write succeeds.
    const keptIds = new Set(images.map((img) => img.publicId).filter(Boolean));
    const removedPublicIds = normalizeListingImages(listing)
      .map((img) => img.publicId)
      .filter((publicId) => publicId && !keptIds.has(publicId));

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        title,
        description,
        location,
        country,
        price,
        images,
        geometry,
      },
      { new: true, runValidators: true }
    );

    // Best-effort: remove orphaned images (never blocks the response on failure).
    await deleteImages(removedPublicIds);

    await cache.del(`listing:${id}`);
    await cache.delPattern('listings:*');

    return NextResponse.json(
      { success: true, data: updatedListing },
      { status: 200 }
    );


  } catch (error) {
    console.error('Error updating listings', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

//DELETE: listing
export async function DELETE(request, { params }) {
  try {

    // Check authenthication
    const authResult = await requireAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const { userId } = authResult;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'modifyListing');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many modifications. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }
        }
      );
    }

    await connectDB();

    const { id } = await params;

    // Validate ID
    const idValidation = idSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if user owns the listing
    if (listing.owner != userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You do not own the listing' },
        { status: 403 }
      );
    }

    // Remove every image (gallery + any legacy single image) from Cloudinary.
    // Best-effort: deleteImages never throws, so a Cloudinary hiccup won't block
    // deleting the listing itself.
    const publicIds = normalizeListingImages(listing)
      .map((img) => img.publicId)
      .filter(Boolean);
    await deleteImages(publicIds);

    await Listing.findByIdAndDelete(id);

    // Invalidate cache
    await cache.del(`listing:${id}`);
    await cache.delPattern('listings:*');

    return NextResponse.json(
      { success: true, message: 'Listing deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}
