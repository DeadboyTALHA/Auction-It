/**
 * Payment Model — placeholder for Sprint 3/4
 * Author: Talha
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
    buyer:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    seller:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    amount:  { type: Number, required: true },
    status:  { type: String, enum: ["pending","completed","refunded"], default: "pending" },
    method:  { type: String, default: "stripe" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
