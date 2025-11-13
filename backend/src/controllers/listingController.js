import Listing from '../models/Listing.js';
import User from '../models/User.js';

import CacheService from '../services/cacheService.js';
import ImageService from '../services/imageService.js';

// Create a listing 
const createListing = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check tier limits
    if (!user.canCreateListing()) {
      return res.status(403).json({
        error: 'Listing limit reached',
        message: `Free tier allows ${user.tier.limits.activeListings} active listings. Upgrade to Premium for unlimited.`,
        remainingListings: 0
      });
    }

    // Process images based on tier
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

    // Create listing
    const listing = await Listing.create({
      owner: req.userId,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      images,
      [req.body.type]: req.body[req.body.type],
      visibility: {
        boost: user.tier.plan === 'premium' ? 1.5 : 1.0,
        priority: user.tier.plan === 'premium' ? 100 : 50,
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
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export { createListing };
