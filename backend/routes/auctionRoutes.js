const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sellerOnly } = require('../middleware/roleAuth');
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
    getEndingSoonAuctions
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
router.post('/', sellerOnly, handleImageUpload, createAuction);
router.get('/my-auctions', sellerOnly, getMyAuctions);
router.put('/:id', sellerOnly, updateAuction);
router.delete('/:id', sellerOnly, cancelAuction);

module.exports = router;
