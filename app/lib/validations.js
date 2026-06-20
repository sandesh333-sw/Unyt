import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_LISTING_IMAGES } from './constants';

// A single listing image. We only accept Cloudinary https URLs so a client
// can't point us at an arbitrary host.
const listingImageSchema = z.object({
  url: z
    .string()
    .url('Invalid image URL')
    .regex(/^https:\/\/res\.cloudinary\.com\//, 'Image must be from Cloudinary'),
  publicId: z.string().optional(),
});

// Listing validation schema
export const listingSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be less than 100 characters')
    .trim(),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be less than 100 characters')
    .trim(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(1000000, 'Price must be less than 1,000,000')
    .int('Price must be a whole number'),
  images: z
    .array(listingImageSchema)
    .min(1, 'At least one image is required')
    .max(MAX_LISTING_IMAGES, `You can upload at most ${MAX_LISTING_IMAGES} images`),
});

// Search query validation
export const searchQuerySchema = z.object({
  search: z
    .string()
    .max(100, 'Search query too long')
    .trim()
    .optional(),
});

// Pagination query validation. `coerce` turns the raw "?page=2" string into a
// number; invalid/missing values fall back to the defaults.
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
});

// ID validation
export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID');