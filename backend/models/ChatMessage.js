const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    issueReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IssueReport",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
