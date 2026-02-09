import { z } from 'zod';

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
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .regex(/^https:\/\/res\.cloudinary\.com\//, 'Image must be from Cloudinary'),
  imagePublicId: z.string().optional(),
});

// Search query validation
export const searchQuerySchema = z.object({
  search: z
    .string()
    .max(100, 'Search query too long')
    .trim()
    .optional(),
});

// ID validation
export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID');