/**
 * Bid Routes
 * Defines API endpoints for bidding functionality
 * Connects routes to bid controller methods
 * Includes protected route for placing bids
 * Author: Moshee-Ur
 * Date: Sprint 1
 */

const express = require("express");
const router = express.Router();
const { placeBid, getBidHistory } = require("../controllers/bidController");

// Fixed import — was wrongly pointing to authMiddleware
const { protect } = require("../middleware/auth");

// POST /api/bids/:auctionId — place a bid (must be logged in)
router.post("/:auctionId", protect, placeBid);

// GET /api/bids/:auctionId — get all bids for an auction (public)
router.get("/:auctionId", getBidHistory);

module.exports = router;