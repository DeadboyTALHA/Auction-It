const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const { submitRating } = require('../controllers/ratingController');

router.use(protect);
router.post('/:auctionId', submitRating);

module.exports = router;