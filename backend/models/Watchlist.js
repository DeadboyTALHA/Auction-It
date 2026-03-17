/**
 * Watchlist Model
 * Stores user-auction watchlist relationships
 * Author: Moshee-Ur | Sprint 2
 */

const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate entries: same user cannot watch the same auction twice
watchlistSchema.index({ user: 1, auction: 1 }, { unique: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);
