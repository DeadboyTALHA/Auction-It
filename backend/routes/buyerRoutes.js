const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const { getMyBids, getWonAuctions } = require("../controllers/buyerController");

router.use(protect);  // All buyer routes require login

router.get("/bids",         getMyBids);
router.get("/won-auctions", getWonAuctions);

module.exports = router;
