/**
 * Watchlist Controller
 * Add, remove, and retrieve watchlist items
 * Author: Moshee-Ur | Sprint 2
 */

const Watchlist = require("../models/Watchlist");
const Auction   = require("../models/Auction");

// @desc   Add auction to watchlist
// @route  POST /api/watchlist/:auctionId
// @access Private
const addToWatchlist = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId);
        if (!auction) {
            return res.status(404).json({ success: false, message: "Auction not found" });
        }
        // Check if already watching
        const existing = await Watchlist.findOne({ user: req.user._id, auction: req.params.auctionId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Auction already in watchlist" });
        }
        const item = await Watchlist.create({ user: req.user._id, auction: req.params.auctionId });
        res.status(201).json({ success: true, message: "Added to watchlist", data: item });
    } catch (error) {
        console.error("addToWatchlist error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Remove auction from watchlist
// @route  DELETE /api/watchlist/:auctionId
// @access Private
const removeFromWatchlist = async (req, res) => {
    try {
        const item = await Watchlist.findOneAndDelete({ user: req.user._id, auction: req.params.auctionId });
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found in watchlist" });
        }
        res.json({ success: true, message: "Removed from watchlist" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Get user's full watchlist
// @route  GET /api/watchlist
// @access Private
const getWatchlist = async (req, res) => {
    try {
        const list = await Watchlist.find({ user: req.user._id })
            .populate({
                path: "auction",
                select: "currentPrice status endTime totalBids isFeatured",
                populate: [
                    { path: "item", select: "title images" },
                    { path: "seller", select: "name" }
                ]
            })
            .sort({ addedAt: -1 });
        res.json({ success: true, count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { addToWatchlist, removeFromWatchlist, getWatchlist };
