// src/routes/authRoutes.js
const express = require('express');
const { verifyUser } = require('../controllers/authController');
const router = express.Router();

// Directly call the verifyUser controller
router.post('/verify', verifyUser);

module.exports = router;
