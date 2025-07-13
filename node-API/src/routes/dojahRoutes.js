const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  handleDojahWebhook,
  saveVerificationData,
  getVerificationStatus
} = require('../controllers/dojahVerificationController');

// Webhook endpoint (no auth middleware as Dojah needs direct access)
router.post('/webhook', handleDojahWebhook);

// Save verification data endpoint (protected)
router.post('/save', protect, saveVerificationData);

// Get verification status endpoint (protected)
router.get('/status', protect, getVerificationStatus);

module.exports = router;
