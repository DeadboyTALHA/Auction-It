const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: { type: String, required: true },
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction"
    },
    type: {
        type: String,
        enum: ['bid_ending', 'watchlist_ending', 'feature_requested',
               'feature_accepted', 'outbid'],
        default: 'bid_ending'
    },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);