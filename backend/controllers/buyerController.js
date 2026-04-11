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
        // Fetch all bids by this user, newest first
        const allBids = await Bid.find({ bidder: req.user._id })
            .populate({
                path: "auction",
                select: "currentPrice status endTime isFeatured startPrice finalPrice",
                populate: [
                    { path: "item",     select: "title images" },
                    { path: "category", select: "name" }
                ]
            })
            .sort({ createdAt: -1 });

        // Deduplicate — keep only the latest bid per auction
        const seen = new Set();
        const latestBids = allBids.filter(bid => {
            const auctionId = bid.auction?._id?.toString();
            if (!auctionId || seen.has(auctionId)) return false;
            seen.add(auctionId);
            return true;
        });

        // Stats calculated from deduplicated bids
        const stats = {
            totalBids:  latestBids.length,
            activeBids: latestBids.filter(b => b.auction?.status === "active").length,
            wonBids:    latestBids.filter(b => b.auction?.status === "sold").length
        };

        res.json({ success: true, stats, count: latestBids.length, data: latestBids });
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
