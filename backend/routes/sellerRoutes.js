/**
 * Seller Routes
 * Author: Rakib | Sprint 2
 */
const express = require("express");
const router = express.Router();
const { protect, sellerOnly } = require("../middleware/auth");
const { getSellerAuctions, getAuctionBids } = require("../controllers/sellerController");

// All seller routes require authentication + seller role
router.use(protect);

router.get("/auctions",           getSellerAuctions);
router.get("/auction/:id/bids",   getAuctionBids);

module.exports = router;