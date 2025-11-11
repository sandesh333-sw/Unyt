import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const listingSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: ['housing', 'marketplace', 'buddy'],
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },

    description: {
        type: String,
        required: true,
        maxLength: 2000
    },

    images: [{
        url: String,
        cloudinaryId: String
    }],

    //Housing specific
    housing: {
        price: Number,
        location: String,
        bedrooms: Number,
        availableFrom: Date,
        duration: String,
        amenities: [String]
    },

    //Marketplace specific
    marketplace: {
        price: Number,
        condition: { type: String, enum: ['new', 'like-new', 'good', 'fair']},
        category: String
    },

    //Buddy system specific
    buddy: {
        type: { type:String, enum: ['airport', 'shopping', 'study']},
        date: Date,
        location: String
    },

    status: {
        active: { type: Boolean, default: true},
        sold: { type: Boolean, default: false},
        featured: { type: Boolean, default: false}
    },

    visibility: {
        boost: { type: Number, default: 1.0 },
        priority: { type: Number, default: 50 }
    },

    stats: {
        views: { type: Number, default: 0},
        inquiries: { type: Number, default: 0}
    }

},{
    timestamps: true
});

//Indexes for searching and filtering
listingSchema.index({type: 1, 'status.active': 1, createdAt: -1});
listingSchema.index({owner: 1, 'status.active': 1});
listingSchema.index({title: 'text', description: 'text'});
listingSchema.index({'housing.price': 1, 'housing.location': 1});

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;