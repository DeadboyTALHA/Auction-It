const Rating    = require('../models/Rating');
const Auction   = require('../models/Auction');
const User      = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/ratings/:auctionId — submit a rating
exports.submitRating = async (req, res) => {
    try {
        const { stars, feedback, notificationId } = req.body;
        if (!stars || stars < 1 || stars > 5)
            return res.status(400).json({ success: false, message: "Stars must be 1-5" });

        const auction = await Auction.findById(req.params.auctionId)
            .populate("seller", "_id");
        if (!auction)
            return res.status(404).json({ success: false, message: "Auction not found" });
        if (auction.winner?.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Only the buyer can rate" });

        // Create rating
        await Rating.create({
            auction:  auction._id,
            rater:    req.user._id,
            seller:   auction.seller._id,
            stars:    parseInt(stars),
            feedback: feedback || ""
        });

        // Recalculate seller average rating
        const allRatings = await Rating.find({ seller: auction.seller._id });
        const avg = allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length;
        await User.findByIdAndUpdate(auction.seller._id, {
            rating:       parseFloat(avg.toFixed(1)),
            totalRatings: allRatings.length
        });

        // Dismiss the rating notification
        if (notificationId) {
            await Notification.findByIdAndDelete(notificationId);
        }

        res.json({ success: true, message: "Rating submitted" });
    } catch (err) {
        if (err.code === 11000)
            return res.status(400).json({ success: false, message: "Already rated" });
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getSellerReviews = async (req, res) => {
    try {
        const reviews = await Rating.find({ seller: req.params.sellerId })
            .populate('rater', 'name')
            .populate('auction', 'item')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};