import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/app/lib/mongodb";
import Listing from "@/app/models/Listing";
import { geocodeLocation } from "@/app/lib/geocoding";
import { cache } from "@/app/lib/redis";
import { requireAuth } from "@/app/lib/authMiddleware";
import { checkRateLimit } from "@/app/lib/rateLimiter";
import { listingSchema, searchQuerySchema } from "@/app/lib/validations";
import { sanitizeObject } from "@/app/lib/sanitize";

// GET -  All listings with optional search and caching
export async function GET(request){
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const rateLimitResult = await checkRateLimit(ip, 'search');

        if (!rateLimitResult.allowed){
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

        await connectDB();

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search');

        // Validate search query
        if (searchQuery){
            const validation = searchQuerySchema.safeParse({search: searchQuery});

            if (!validation.success){
                return NextResponse.json(
                    { success: false, error: validation.error.errors[0].message },
                    { status: 400 }
                );
            }
        }

        // Sanitize search input 
        const search = searchQuery ? sanitizeObject({search: searchQuery }).search : null;

        // Create cache key
        const cacheKey = search ? `listings:search:${search}`: 'listings:all';

        // Try to get from cache first
        const cachedData = await cache.get(cacheKey);

        if (cachedData){
            console.log('Cache HIT:', cacheKey);

            return NextResponse.json({
                success: true,
                data: cachedData,
                cached: true
            }, {status: 200});
        }

        console.log('Cache Miss', cacheKey);

        // If not in cache, query database
        let query = {};

        if (search){
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i'}},
                    { description: {$regex: search, $options: 'i'}},
                    { location: { $regex: search, $options: 'i'}},
                    { country: { $regex: search, $options: 'i'}},
                ]
            };
        }

        const listings = await Listing.find(query).sort({createdAt: -1});

        // Cache the results for 5 minutes (300 seconds)
        await cache.set(cacheKey, listings, 300);

        return NextResponse.json({
            success: true,
            data: listings,
            cached: false
        }, { status: 200});
    } catch (error) {
        console.error('Error fetching listings: ', error);
        return NextResponse.json(
            {success: false, error: 'Failed to fetch listings'},
            {status: 500}
        );
    }
}

// POST - Create new Listing
export async function POST(request){
    try {
        const { userId } = await auth();
        

        if(!userId){
            return NextResponse.json(
                { success: false, error: 'Unauthorized'},
                { status: 401 }
            );
        }
        console.log('User id is',userId);

        
        await connectDB();

        const body = await request.json();

        const { title, description, location, country, price, imageUrl, imagePublicId } = body;

        // Validate
        if (!title || !description || !location || !country || !price){
            return NextResponse.json(
                { status: false, error: 'Missing required files'},
                { status: 400 }
            );
        }

        // Geocode the location
        const geometry = await geocodeLocation(location);

        const newListing = await Listing.create({
            title,
            description,
            location,
            country,
            price,
            imageUrl,
            imagePublicId,
            owner: userId,
            geometry,
        });

        // Invalidate all listings cache
        await cache.delPattern('listings:*');

        return NextResponse.json(
            { success: true, data: newListing},
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating listing:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create listing'},
            { status: 500}
        );
    }
}


