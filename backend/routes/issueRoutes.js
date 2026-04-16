const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
    submitReport, getAllReports, getMyReports,
    getMessages, sendMessage
} = require('../controllers/issueController');

router.use(protect);

router.post('/',              submitReport);   // any user
router.get('/my',             getMyReports);   // any user
router.get('/',    adminOnly, getAllReports);   // admin only
router.get('/:id/messages',   getMessages);    // user or admin
router.post('/:id/messages',  sendMessage);    // user or admin

module.exports = router;
