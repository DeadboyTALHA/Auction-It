const stripe         = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Auction        = require('../models/Auction');
const Payment        = require('../models/Payment');
const Notification   = require('../models/Notification');
const User           = require('../models/User');

// POST /api/payments/:auctionId/create-intent
// Creates a Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId)
            .populate("item", "title")
            .populate("seller", "name");
        if (!auction)
            return res.status(404).json({ success: false, message: "Auction not found" });
        if (auction.winner?.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Only the winner can pay" });
        if (auction.status !== "pending_payment")
            return res.status(400).json({ success: false, message: "Payment not required" });

        // Convert BDT to USD for Stripe (1 USD ≈ 110 BDT)
        const amountUSD = Math.round((auction.finalPrice / 110) * 100); // cents

        const paymentIntent = await stripe.paymentIntents.create({
            amount:   amountUSD,
            currency: "usd",
            metadata: {
                auctionId: auction._id.toString(),
                buyerId:   req.user._id.toString(),
                amountBDT: auction.finalPrice.toString()
            }
        });

        res.json({
            success: true,
            clientSecret:   paymentIntent.client_secret,
            amountBDT:      auction.finalPrice,
            auctionTitle:   auction.item?.title
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/payments/:auctionId/confirm
// Called after Stripe payment succeeds — marks auction as sold
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, method } = req.body;
        const auction = await Auction.findById(req.params.auctionId)
            .populate("item", "title")
            .populate("seller", "_id name");
        if (!auction)
            return res.status(404).json({ success: false, message: "Auction not found" });
        if (auction.winner?.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Not authorised" });

        // Record payment
        await Payment.create({
            auction:              auction._id,
            buyer:                req.user._id,
            amount:               auction.finalPrice,
            method:               method || "card",
            stripePaymentIntentId: paymentIntentId,
            status:               "completed"
        });

        // Update auction status
        auction.status           = "sold";
        auction.paymentCompleted = true;
        await auction.save();

        const io = req.app.get("io");

        // Notify buyer
        const buyerNotif = await Notification.create({
            user:    req.user._id,
            auction: auction._id,
            type:    "feature_accepted",
            message: `Payment successful for "${auction.item?.title}". Enjoy your purchase!`
        });
        if (io) io.to(`user-${req.user._id}`).emit("new-notification", {
            _id: buyerNotif._id, message: buyerNotif.message,
            auction: { _id: auction._id }
        });

        // Notify seller
        const sellerNotif = await Notification.create({
            user:    auction.seller._id,
            auction: auction._id,
            type:    "feature_accepted",
            message: `Payment received for your auction "${auction.item?.title}".`
        });
        if (io) io.to(`user-${auction.seller._id}`).emit("new-notification", {
            _id: sellerNotif._id, message: sellerNotif.message,
            auction: { _id: auction._id }
        });

        res.json({ success: true, message: "Payment confirmed, auction sold" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};