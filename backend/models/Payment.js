const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: { type: Number, required: true },
    method: {
        type: String,
        enum: ['card', 'nagad', 'bkash'],
        required: true
    },
    stripePaymentIntentId: { type: String },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);