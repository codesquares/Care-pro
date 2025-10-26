const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { earningsRequest } = require('../controllers/earningsController');


router.post("/", protect, earningsRequest);


module.exports = router;
