/**
 * Bid Routes
 * Defines API endpoints for bidding functionality
 * Connects routes to bid controller methods
 * Includes protected route for placing bids
 * Author: Moshee-Ur
 * Date: Sprint 1
 */

const express = require('express');
const router = express.Router();
const { placeBid, getBidHistory } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:auctionId', protect, placeBid);
router.get('/:auctionId', getBidHistory);

module.exports = router;