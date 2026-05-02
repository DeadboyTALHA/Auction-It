const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, dismissNotification, markAllRead, markOneRead } =
    require('../controllers/notificationController');

router.use(protect);
router.get('/',    getNotifications);
router.delete('/:id', dismissNotification);
router.put('/:id/read', markOneRead);
router.put('/mark-all-read', markAllRead);
module.exports = router;