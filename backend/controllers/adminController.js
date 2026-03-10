/**
 * Admin Controller
 * Handles admin-specific operations
 * Author: Talha | Sprint 2
 */

const Auction = require("../models/Auction");

// @desc   Toggle featured status of an auction
// @route  PUT /api/admin/auctions/:id/feature
// @access Admin only
const toggleFeatured = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) {
            return res.status(404).json({ success: false, message: "Auction not found" });
        }
        auction.isFeatured = !auction.isFeatured;
        auction.featuredUntil = auction.isFeatured
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            : null;
        await auction.save();
        res.json({
            success: true,
            message: auction.isFeatured ? "Auction marked as featured" : "Auction removed from featured",
            data: { id: auction._id, isFeatured: auction.isFeatured, featuredUntil: auction.featuredUntil }
        });
    } catch (error) {
        console.error("toggleFeatured error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Get all featured auctions
// @route  GET /api/admin/auctions/featured
// @access Public
const getFeaturedAuctions = async (req, res) => {
    try {
        const now = new Date();
        const featured = await Auction.find({
            isFeatured: true,
            status: "active",
            $or: [{ featuredUntil: null }, { featuredUntil: { $gt: now } }]
        })
        .populate("item", "title images")
        .populate("seller", "name")
        .sort({ featuredUntil: 1 });
        res.json({ success: true, count: featured.length, data: featured });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { toggleFeatured, getFeaturedAuctions };
