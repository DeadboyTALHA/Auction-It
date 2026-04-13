const express = require('express');
const router = express.Router();
const { protect, sellerOnly  } = require('../middleware/auth');
const { handleImageUpload } = require('../middleware/upload');
const {
    // Existing functions
    createAuction,
    getMyAuctions,
    updateAuction,
    cancelAuction,
    // New browse functions
    browseAuctions,
    searchAuctions,
    getEndingSoonAuctions,
    requestFeature
} = require('../controllers/auctionController');

// ======================
// PUBLIC ROUTES
// ======================
router.get('/browse', browseAuctions);
router.get('/search', searchAuctions);
router.get('/ending-soon', getEndingSoonAuctions);

// ======================
// PROTECTED ROUTES
// ======================
router.use(protect);

// Seller-only routes
router.post('/', handleImageUpload, createAuction);
router.post('/:id/request-feature', requestFeature);
router.get('/my-auctions', getMyAuctions);
router.put('/:id', updateAuction);
router.delete('/:id', cancelAuction);

module.exports = router;
