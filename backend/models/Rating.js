const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
        required: true
    },
    rater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    feedback: {
        type: String,
        maxlength: 500,
        default: ""
    }
}, { timestamps: true });

// One rating per buyer per auction
ratingSchema.index({ auction: 1, rater: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);