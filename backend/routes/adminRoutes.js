/**
 * Admin Routes
 * Author: Talha | Sprint 2
 */
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { toggleFeatured, getFeaturedAuctions } = require("../controllers/adminController");
const adminController = require('../controllers/adminController');

// Featured auction routes
router.get("/auctions/featured", getFeaturedAuctions);       // public
router.put("/auctions/:id/feature", protect, adminOnly, toggleFeatured);  // admin only

router.delete('/auctions/:id', adminController.deleteAuction);


module.exports = router;
