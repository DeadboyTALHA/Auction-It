const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: [1000, "Message cannot exceed 200 words"]
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
}, { timestamps: true });

module.exports = mongoose.model('IssueReport', issueReportSchema);
