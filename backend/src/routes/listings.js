const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect } = require('../middleware/auth');
const { checkListingLimit } = require('../middleware/tierGuard');
const { rateLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  }
});

// All routes require authentication
router.use(protect);
router.use(rateLimiter);

router.get('/', listingController.getListings);
router.post('/search', listingController.searchListings);
router.post('/', checkListingLimit, upload.array('images', 10), listingController.createListing);
router.delete('/:id', listingController.deleteListing);

module.exports = router;