const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email) => email.endsWith('@herts.ac.uk'),
      message: 'Must use University of Hertfordshire email'
    }
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  tier: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    
    limits: {
      activeListings: { type: Number, default: 3 },
      imagesPerListing: { type: Number, default: 5 },
      dailyMessages: { type: Number, default: 10 },
      searchFilters: { type: Number, default: 2 }
    },
    
    usage: {
      currentListings: { type: Number, default: 0 },
      messagestoday: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now }
    },
    
    premiumUntil: Date
  },
  
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 },
    phone: String,
    isInternational: { type: Boolean, default: false },
    country: String,
    arrivalDate: Date,
    verified: { type: Boolean, default: false }
  },
  
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days
  }],
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1, 'tier.plan': 1 });
userSchema.index({ 'tier.plan': 1, createdAt: -1 });
userSchema.index({ 'tier.usage.currentListings': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can create more listings
userSchema.methods.canCreateListing = function() {
  if (this.tier.plan === 'premium') return true;
  return this.tier.usage.currentListings < this.tier.limits.activeListings;
};

// Get remaining listings
userSchema.methods.getRemainingListings = function() {
  if (this.tier.plan === 'premium') return -1; // unlimited
  return Math.max(0, this.tier.limits.activeListings - this.tier.usage.currentListings);
};

module.exports = mongoose.model('User', userSchema);