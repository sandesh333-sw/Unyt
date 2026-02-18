import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import connectDB from "@/app/lib/mongodb";
import Listing from "@/app/models/Listing";
import { geocodeLocation } from "@/app/lib/geocoding";
import { cache } from "@/app/lib/redis";
import { requireAuth } from "@/app/lib/authMiddleware";
import { checkRateLimit } from "@/app/lib/rateLimiter";
import { listingSchema, idSchema } from "@/app/lib/validations";
import { sanitizeObject } from "@/app/lib/sanitize";

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

    // Sanitize input
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validation = listingSchema.safeParse(sanitizedBody);

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

    const { title, description, location, country, price, imageUrl, imagePublicId } = validation.data;

    // Geocode location if it changed
    let geometry = listing.geometry;
    if (location !== listing.location) {
      geometry = await geocodeLocation(location);
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        title,
        description,
        location,
        country,
        price,
        imageUrl,
        imagePublicId,
        geometry,
      },
      { new: true, runValidators: true }
    );

    await cache.del(`listings:${id}`);
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

    // Delete image from Cloudinary if exists
    if (listing.imagePublicId) {
      try {
        const cloudinary = require('cloudinary').v2;
        
        cloudinary.config({
          cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        await cloudinary.uploader.destroy(listing.imagePublicId);
        console.log('Cloudinary image deleted:', listing.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue with listing deletion even if image deletion fails
      }
    }


    await Listing.findByIdAndDelete(id);

    // Invalidate cache
    await cache.del(`lisings:${id}`);
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
