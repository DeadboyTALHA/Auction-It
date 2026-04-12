/**
 * Bid Controller
 * Handles bid placement and bid history retrieval
 * Validates bid amount and auction status
 * Updates auction current price and total bids
 * Author: Moshee-Ur
 * Date: Sprint 1
 */

const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const AutoBid  = require('../models/AutoBid');

/**
 * @desc Place a bid
 * @route POST /api/bids/:auctionId
 * @access Private
 */

const triggerAutoBids = async (auctionId, lastBidderId, auction, io) => {
    try {
        // Find all active auto-bids for this auction except from the last bidder
        const autoBids = await AutoBid.find({
            auction: auctionId,
            bidder:  { $ne: lastBidderId },
            isActive: true
        }).sort({ createdAt: 1 }); // oldest first = FIFO

        for (const ab of autoBids) {
            const nextBid = auction.currentPrice + auction.minIncrement;
            // Check if the auto-bid limit covers the next bid
            if (nextBid > ab.limitPrice) {
                // Limit exceeded — deactivate
                ab.isActive = false;
                await ab.save();
                continue;
            }
            // Also skip if this user is already the highest bidder
            const highestBid = await Bid.findOne({ auction: auctionId })
                .sort({ amount: -1 });
            if (highestBid?.bidder?.toString() === ab.bidder.toString()) {
                continue; // already winning, no need to auto-bid
            }
            // Place the auto-bid
            try {
                auction.placeBid(nextBid);
                const newBid = await Bid.create({
                    auction: auctionId,
                    bidder:  ab.bidder,
                    amount:  nextBid
                });
                await auction.save();
                // Emit socket update
                if (io) {
                    io.to(`auction-${auctionId}`).emit("bid-updated", {
                        auctionId,
                        currentPrice: auction.currentPrice,
                        totalBids:    auction.totalBids,
                        newBid: { _id: newBid._id, amount: newBid.amount,
                            bidder: { name: "Auto-Bid" }, createdAt: newBid.createdAt }
                    });
                }
                // Only one auto-bid fires per new bid placed
                break;
            } catch (e) { /* bid validation failed, skip */ }
        }
    } catch (err) {
        console.error("triggerAutoBids error:", err);
    }
};

exports.placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: 'Invalid auction ID' });
    }

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Prevent seller bidding
    if (auction.seller.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot bid on your own auction' });
    }

    try {
      // Use Auction model method for validation
      auction.placeBid(amount);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Save bid history
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user.id,
      amount,
    });

    // Save updated auction (currentPrice + totalBids updated)
    await auction.save();

    // Emit real-time update to all users viewing this auction
    const io = req.app.get("io");
    if (io) {
        io.to(`auction-${auctionId}`).emit("bid-updated", {
            auctionId,
            currentPrice: auction.currentPrice,
            totalBids:    auction.totalBids,
            newBid: {
                _id:       bid._id,
                amount:    bid.amount,
                bidder:    { name: req.user.name },
                createdAt: bid.createdAt
            }
        });
    }
    
    // Trigger auto-bids from other users who set limits
    await triggerAutoBids(auctionId, req.user.id, auction, req.app.get("io"));

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid,
      currentPrice: auction.currentPrice,
      totalBids: auction.totalBids,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * @desc Get bid history
 * @route GET /api/bids/:auctionId
 * @access Public
 */
exports.getBidHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: 'Invalid auction ID' });
    }

    const bids = await Bid.find({ auction: auctionId })
      .populate('bidder', 'name email rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: bids.length,
      bids,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setAutoBid = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { limitPrice } = req.body;
        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ success: false, message: "Auction not found" });
        if (auction.seller.toString() === req.user.id)
            return res.status(400).json({ success: false, message: "Cannot auto-bid on own auction" });
        if (limitPrice <= auction.currentPrice)
            return res.status(400).json({ success: false, message: "Limit must be above current price" });

        // Upsert auto-bid
        await AutoBid.findOneAndUpdate(
            { auction: auctionId, bidder: req.user.id },
            { limitPrice, isActive: true },
            { upsert: true, new: true }
        );

        // Immediately place first auto-bid if current price + increment <= limit
        const nextBid = auction.currentPrice + auction.minIncrement;
        if (nextBid <= limitPrice) {
            const highestBid = await Bid.findOne({ auction: auctionId }).sort({ amount: -1 });
            if (!highestBid || highestBid.bidder.toString() !== req.user.id) {
                try {
                    auction.placeBid(nextBid);
                    await Bid.create({ auction: auctionId, bidder: req.user.id, amount: nextBid });
                    await auction.save();
                } catch (e) { /* ignore */ }
            }
        }
        res.json({ success: true, message: "Auto-bid activated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.turnOffAutoBid = async (req, res) => {
    try {
        const { auctionId } = req.params;
        await AutoBid.findOneAndUpdate(
            { auction: auctionId, bidder: req.user.id },
            { isActive: false }
        );
        res.json({ success: true, message: "Auto-bid turned off" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};