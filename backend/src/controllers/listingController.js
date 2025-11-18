const Listing = require('../models/Listing');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const ImageService = require('../services/imageService');

// Create listing
exports.createListing = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Check tier limits
    if (!user.canCreateListing()) {
      return res.status(403).json({
        error: 'Listing limit reached',
        message: `Free tier allows ${user.tier.limits.activeListings} active listings. Upgrade to Premium for unlimited.`,
        remainingListings: 0
      });
    }
    
    // Process images with tier-based compression
    let images = [];
    if (req.files && req.files.length > 0) {
      const maxImages = user.tier.limits.imagesPerListing;
      const filesToProcess = req.files.slice(0, maxImages);
      
      images = await Promise.all(
        filesToProcess.map(file => 
          ImageService.uploadImage(file, user.tier.plan)
        )
      );
    }
    
    // Parse type-specific data (comes as JSON string from FormData)
    let typeSpecificData = {};
    if (req.body[req.body.type]) {
      try {
        typeSpecificData = typeof req.body[req.body.type] === 'string' 
          ? JSON.parse(req.body[req.body.type])
          : req.body[req.body.type];
      } catch (e) {
        typeSpecificData = {};
      }
    }
    
    // Create listing
    const listing = await Listing.create({
      owner: req.userId,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      images,
      [req.body.type]: typeSpecificData, // housing/marketplace/buddy specific data
      visibility: {
        boost: user.tier.plan === 'premium' ? 1.5 : 1.0,
        priority: user.tier.plan === 'premium' ? 100 : 50
      }
    });
    
    // Update user's usage
    user.tier.usage.currentListings += 1;
    await user.save();
    
    // Clear cache
    await CacheService.clearPattern('listings:*');
    
    res.status(201).json({
      listing,
      remainingListings: user.getRemainingListings()
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get listings with caching
exports.getListings = async (req, res) => {
  try {
    const { type, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const user = await User.findById(req.userId);
    
    // Build cache key
    const cacheKey = `listings:${type}:${page}:${sort}:${user.tier.plan}`;
    
    // Try cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Build query
    const query = { 'status.active': true };
    if (type) query.type = type;
    
    // Premium users see featured listings first
    let sortOptions = {};
    if (user.tier.plan === 'premium') {
      sortOptions = { 'visibility.priority': -1, createdAt: -1 };
    } else {
      sortOptions = sort.startsWith('-') 
        ? { [sort.slice(1)]: -1 }
        : { [sort]: 1 };
    }
    
    // Execute query with lean for performance
    const listings = await Listing
      .find(query)
      .populate('owner', 'firstName lastName tier.plan profile.verified')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await Listing.countDocuments(query);
    
    const result = {
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
    
    // Cache result (shorter TTL for premium for fresher data)
    const ttl = user.tier.plan === 'premium' ? 300 : 3600; // 5 min vs 1 hour
    await CacheService.set(cacheKey, JSON.stringify(result), ttl);
    
    res.json(result);
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Search listings with text search
exports.searchListings = async (req, res) => {
  try {
    const { q, filters = {} } = req.body;
    const user = await User.findById(req.userId);
    
    // Free users: limited filters
    if (user.tier.plan === 'free') {
      const allowedFilters = ['type', 'maxPrice'];
      Object.keys(filters).forEach(key => {
        if (!allowedFilters.includes(key)) {
          delete filters[key];
        }
      });
    }
    
    // Build aggregation pipeline
    const pipeline = [
      // Text search
      {
        $match: {
          $text: { $search: q },
          'status.active': true,
          ...(filters.type && { type: filters.type })
        }
      },
      
      // Add search score
      {
        $addFields: {
          score: { $meta: 'textScore' },
          // Premium listings get boost
          finalScore: {
            $multiply: [
              { $meta: 'textScore' },
              '$visibility.boost'
            ]
          }
        }
      },
      
      // Sort by score
      { $sort: { finalScore: -1 } },
      
      // Limit results
      { $limit: user.tier.plan === 'premium' ? 100 : 20 },
      
      // Populate owner
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: '$owner' },
      
      // Project needed fields
      {
        $project: {
          title: 1,
          description: 1,
          type: 1,
          images: 1,
          housing: 1,
          marketplace: 1,
          buddy: 1,
          createdAt: 1,
          'owner.firstName': 1,
          'owner.lastName': 1,
          'owner.tier.plan': 1
        }
      }
    ];
    
    const results = await Listing.aggregate(pipeline);
    
    res.json({ results, count: results.length });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listing.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Delete images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      await Promise.all(
        listing.images.map(img => 
          ImageService.deleteImage(img.cloudinaryId)
        )
      );
    }
    
    await listing.remove();
    
    // Update user's usage
    const user = await User.findById(req.userId);
    user.tier.usage.currentListings = Math.max(0, user.tier.usage.currentListings - 1);
    await user.save();
    
    // Clear cache
    await CacheService.clearPattern('listings:*');
    
    res.json({ message: 'Listing deleted' });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};