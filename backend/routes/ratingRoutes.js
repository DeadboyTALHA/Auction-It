const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const { submitRating, getSellerReviews } = require('../controllers/ratingController');

router.use(protect);
router.post('/:auctionId', submitRating);
router.get('/seller/:sellerId', getSellerReviews);

module.exports = router;