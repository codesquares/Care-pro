const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { withdrawFunds } = require('../controllers/withdrawalController');


// router.get("/:id", protect, allWithdrawals);
router.post("/", protect, withdrawFunds);
// router.get("/withdrawable-amount", protect, withdrawableAmount);

module.exports = router;
