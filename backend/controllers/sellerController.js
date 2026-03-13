/**
 * Seller Controller
 * Provides seller-specific auction and bid data
 * Author: Rakib | Sprint 2
 */

const Auction = require("../models/Auction");
const Bid     = require("../models/Bid");

// @desc   Get all auctions created by the logged-in seller
// @route  GET /api/seller/auctions
// @access Private (seller/admin)
const getSellerAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find({ seller: req.user._id })
            .populate("item", "title images condition")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        // Build stats summary
        const stats = {
            total:   auctions.length,
            active:  auctions.filter(a => a.status === "active").length,
            pending: auctions.filter(a => a.status === "pending").length,
            ended:   auctions.filter(a => a.status === "ended" || a.status === "sold").length,
            totalBids: auctions.reduce((sum, a) => sum + (a.totalBids || 0), 0)
        };

        res.json({ success: true, stats, count: auctions.length, data: auctions });
    } catch (error) {
        console.error("getSellerAuctions error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// @desc   Get all bids for a specific auction owned by the seller
// @route  GET /api/seller/auction/:id/bids
// @access Private (seller/admin)
const getAuctionBids = async (req, res) => {
    try {
        // Verify the auction belongs to this seller
        const auction = await Auction.findById(req.params.id)
            .populate("item", "title")
            .populate("winner", "name email");

        if (!auction) {
            return res.status(404).json({ success: false, message: "Auction not found" });
        }
        if (String(auction.seller) !== String(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorized to view bids for this auction" });
        }

        const bids = await Bid.find({ auction: req.params.id })
            .populate("bidder", "name email")
            .sort({ amount: -1 });

        const bidStats = {
            totalBids:    bids.length,
            highestBid:   bids.length > 0 ? bids[0].amount : 0,
            lowestBid:    bids.length > 0 ? bids[bids.length - 1].amount : 0,
            currentPrice: auction.currentPrice,
            uniqueBidders: [...new Set(bids.map(b => String(b.bidder._id)))].length
        };

        res.json({
            success: true,
            auction: { id: auction._id, title: auction.item?.title, status: auction.status, endTime: auction.endTime },
            bidStats,
            data: bids
        });
    } catch (error) {
        console.error("getAuctionBids error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getSellerAuctions, getAuctionBids };