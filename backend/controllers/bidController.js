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

/**
 * @desc Place a bid
 * @route POST /api/bids/:auctionId
 * @access Private
 */
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