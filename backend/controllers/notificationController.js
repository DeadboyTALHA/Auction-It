const Notification = require('../models/Notification');

// GET /api/notifications — get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .populate("auction", "item status")
            .populate("issueReport", "_id")
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/notifications/:id — dismiss a notification
exports.dismissNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });
        res.json({ success: true, message: "Notification dismissed" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: { $ne: true } },
            { $set: { isRead: true } }
        );
        res.json({ success: true, message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.markOneRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};