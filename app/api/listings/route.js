import { NextResponse } from "next/server";
import Listing from "@/app/models/Listing";
import connectDB from "@/app/lib/mongodb";
import { geocodeLocation } from "@/app/lib/geocoding";
import { cache } from "@/app/lib/redis";
import { getListings } from "@/app/lib/listings";
import { requireAuth } from "@/app/lib/authMiddleware";
import { checkRateLimit } from "@/app/lib/rateLimiter";
import { listingSchema, searchQuerySchema, paginationSchema } from "@/app/lib/validations";
import { sanitizeFields } from "@/app/lib/sanitize";

// Free-text fields that get HTML-sanitized before storage. Image URLs and
// numeric/array fields are validated by Zod, not escaped.
const TEXT_FIELDS = ['title', 'description', 'location', 'country'];

// Prevent static optimization - making dynamic API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET -  Paginated listings with optional search (cached via lib/listings)
export async function GET(request) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const rateLimitResult = await checkRateLimit(ip, 'search');

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests. Please try again',
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

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search');

        // Validate search query
        if (searchQuery) {
            const validation = searchQuerySchema.safeParse({ search: searchQuery });

            if (!validation.success) {
                return NextResponse.json(
                    { success: false, error: validation.error.errors[0].message },
                    { status: 400 }
                );
            }
        }

        // Parse pagination (?page, ?limit) — invalid values fall back to defaults.
        const { page, limit } = paginationSchema.parse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
        });

        const result = await getListings({ search: searchQuery || '', page, limit });

        return NextResponse.json({
            success: true,
            data: result.listings,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.hasMore,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching listings: ', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch listings' },
            { status: 500 }
        );
    }
}

// POST - Create new Listing
export async function POST(request) {
    try {

        // Check authentication
        const authResult = await requireAuth();
        if (!authResult.authorized) {
            return authResult.response;
        }

        const { userId } = authResult;

        // Rate limiting
        const rateLimitResult = await checkRateLimit(userId, 'createListing');
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many listings created. Please try again later.',
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

        const body = await request.json();

        // Validate first (also enforces Cloudinary image URLs), then sanitize the
        // free-text fields. We deliberately don't escape the whole body — that
        // would corrupt the image URLs.
        const validation = listingSchema.safeParse(body);
        if (!validation.success){
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validation.error.errors
                },
                { status: 400}
            );
        }

        const clean = sanitizeFields(validation.data, TEXT_FIELDS);
        const { title, description, location, country, price, images } = clean;

        // Geocode using the raw (un-escaped) location for accuracy.
        const geometry = await geocodeLocation(validation.data.location);

        const newListing = await Listing.create({
            title,
            description,
            location,
            country,
            price,
            images,
            owner: userId,
            geometry,
        });

        // Invalidate all listings cache
        await cache.delPattern('listings:*');

        return NextResponse.json(
            { success: true, data: newListing },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating listing:', error);
        
        return NextResponse.json(
            { success: false, error: 'Failed to create listing' },
            { status: 500 }
        );
    }
}


