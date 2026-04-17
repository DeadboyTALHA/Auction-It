const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const { createPaymentIntent, confirmPayment } =
    require('../controllers/paymentController');

router.use(protect);
router.post('/:auctionId/create-intent', createPaymentIntent);
router.post('/:auctionId/confirm',        confirmPayment);

module.exports = router;