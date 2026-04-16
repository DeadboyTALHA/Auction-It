const IssueReport  = require('../models/IssueReport');
const ChatMessage  = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const User         = require('../models/User');

// POST /api/issues — submit a new issue report
exports.submitReport = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim())
            return res.status(400).json({ success: false, message: "Message is required" });

        const report = await IssueReport.create({
            user: req.user._id,
            message: message.trim()
        });

        const io = req.app.get("io");

        // 1. Notify the reporting user
        const userNotif = await Notification.create({
            user:    req.user._id,
            type:    "issue_reported",
            message: "Your issue has been successfully reported"
        });
        if (io) io.to(`user-${req.user._id}`).emit("new-notification", {
            _id: userNotif._id, message: userNotif.message, type: userNotif.type
        });

        // 2. Notify all admins
        const admins = await User.find({ role: "admin" }).select("_id");
        for (const admin of admins) {
            const adminNotif = await Notification.create({
                user:    admin._id,
                type:    "issue_reported",
                message: `${req.user.username} has reported an issue`,
                issueReport: report._id
            });
            if (io) io.to(`user-${admin._id}`).emit("new-notification", {
                _id:         adminNotif._id,
                message:     adminNotif.message,
                type:        adminNotif.type,
                issueReport: { _id: report._id }
            });
        }

        res.status(201).json({ success: true, message: "Report submitted", data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/issues — get all reports (admin only)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await IssueReport.find()
            .populate("user", "name username email")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/issues/my — get current user's reports
exports.getMyReports = async (req, res) => {
    try {
        const reports = await IssueReport.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/issues/:id/messages — get chat messages for a report
exports.getMessages = async (req, res) => {
    try {
        const messages = await ChatMessage.find({ issueReport: req.params.id })
            .populate("sender", "name username role")
            .sort({ createdAt: 1 });
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/issues/:id/messages — send a chat message
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim())
            return res.status(400).json({ success: false, message: "Message is required" });

        const report = await IssueReport.findById(req.params.id)
            .populate("user", "name username _id");
        if (!report)
            return res.status(404).json({ success: false, message: "Report not found" });

        const chatMsg = await ChatMessage.create({
            issueReport: report._id,
            sender:      req.user._id,
            message:     message.trim()
        });

        const populatedMsg = await ChatMessage.findById(chatMsg._id)
            .populate("sender", "name username role");

        const io = req.app.get("io");

        // Emit to the chat room
        if (io) {
            io.to(`chat-${report._id}`).emit("new-chat-message", populatedMsg);
        }

        // If sender is admin, notify the user
        if (req.user.role === "admin") {
            const notif = await Notification.create({
                user:        report.user._id,
                type:        "chat_message",
                message:     "Admin sent you a message",
                issueReport: report._id
            });
            if (io) io.to(`user-${report.user._id}`).emit("new-notification", {
                _id:         notif._id,
                message:     notif.message,
                type:        notif.type,
                issueReport: { _id: report._id }
            });
        }

        res.status(201).json({ success: true, data: populatedMsg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
