/**
 * Chat Model — placeholder for Sprint 3/4
 * Author: Moshee-Ur
 */
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content:   { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    messages:     [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
