const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const { addToWatchlist, removeFromWatchlist, getWatchlist } = require("../controllers/watchlistController");

router.use(protect);  // All watchlist routes require login

router.get("/",              getWatchlist);
router.post("/:auctionId",   addToWatchlist);
router.delete("/:auctionId", removeFromWatchlist);

module.exports = router;