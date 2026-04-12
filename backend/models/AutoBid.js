const mongoose = require('mongoose');

const autoBidSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
        required: true
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    limitPrice: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Only one active auto-bid per user per auction
autoBidSchema.index({ auction: 1, bidder: 1 }, { unique: true });

module.exports = mongoose.model('AutoBid', autoBidSchema);
