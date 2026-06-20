import mongoose from "mongoose";

// A single image stored on a listing. `_id: false` keeps these as plain
// subdocuments (no per-image ObjectId) since we key off the Cloudinary publicId.
const imageSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        publicId: { type: String },
    },
    { _id: false }
);

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    // Gallery of images. New listings populate this.
    images: {
        type: [imageSchema],
        default: [],
    },
    // Legacy single-image fields, kept so listings created before the gallery
    // feature still render. Read through normalizeListingImages() in lib/images.js.
    imageUrl: {
        type: String,
    },
    imagePublicId: {
        type: String, //For Cloudinary
    },
    owner: {
        type: String, //Clerk UserId
        required: true,
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [Longitude, latitude]
            default: [0,0]
        }
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review',
        },
    ],
},
    {
        timestamps: true,
    }
);

// Listings are always read newest-first; index createdAt so that sort doesn't
// scan the whole collection.
listingSchema.index({ createdAt: -1 });

// TODO(search): the listings search currently uses an unindexed case-insensitive
// $regex (full collection scan). When the catalogue grows, replace it with a
// text index (below) and switch the query in lib/listings.js to $text, or move
// to MongoDB Atlas Search for typo-tolerance and relevance ranking.
// listingSchema.index({ title: 'text', description: 'text', location: 'text', country: 'text' });

export default mongoose.models.Listing || mongoose.model('Listing', listingSchema);