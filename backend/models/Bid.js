/**
 * Bid Model
 * Represents a bid placed by a user on an auction
 * Stores bid amount, bidder reference, and auction reference
 * Maintains bid history for each auction
 * Author: Moshee-Ur
 * Date: Sprint 1
 */
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Bid amount must be greater than 0'],
    },
  },
  { timestamps: true }
);

bidSchema.index({ auction: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);