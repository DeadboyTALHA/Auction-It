/**
 * Buyer Controller
 * Buyer dashboard — bid history and won auctions
 * Author: Moshee-Ur | Sprint 2
 */

const Bid     = require("../models/Bid");
const Auction = require("../models/Auction");

// @desc   Get all bids placed by the logged-in user
// @route  GET /api/buyer/bids
// @access Private
const getMyBids = async (req, res) => {
    try {
const bids = await Bid.find({ bidder: req.user._id })
            .populate({
                path: "auction",
                select: "currentPrice status endTime isFeatured",
                populate: { path: "item", select: "title images" }
            })
            .sort({ createdAt: -1 });

        const stats = {
            totalBids:  bids.length,
            activeBids: bids.filter(b => b.auction && b.auction.status === "active").length,
            wonBids:    bids.filter(b => b.auction && b.auction.status === "sold").length
        };

        res.json({ success: true, stats, count: bids.length, data: bids });
    } catch (error) {
        console.error("getMyBids error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Get auctions won by the logged-in user
// @route  GET /api/buyer/won-auctions
// @access Private
const getWonAuctions = async (req, res) => {
    try {
        const wonAuctions = await Auction.find({ winner: req.user._id })
            .populate("item", "title images condition")
            .populate("seller", "name email")
            .sort({ updatedAt: -1 });

        const totalSpent = wonAuctions.reduce((sum, a) => sum + (a.finalPrice || a.currentPrice || 0), 0);

        res.json({
            success: true,
            totalSpent,
            count: wonAuctions.length,
            data: wonAuctions
        });
    } catch (error) {
        console.error("getWonAuctions error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getMyBids, getWonAuctions };
