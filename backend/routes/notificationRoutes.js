const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, dismissNotification } =
    require('../controllers/notificationController');

router.use(protect);
router.get('/',    getNotifications);
router.delete('/:id', dismissNotification);

module.exports = router;