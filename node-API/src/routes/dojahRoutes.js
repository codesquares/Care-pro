const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const dojahController = require('../controllers/dojahVerificationController');

// Webhook endpoint (no auth middleware as Dojah needs direct access)
router.post('/webhook', dojahController.handleDojahWebhook);
router.get('/webhook', dojahController.handleGetDojahWebhook);

// Save verification data endpoint (protected)
router.post('/save', protect, dojahController.saveVerificationData);

// Get verification status endpoint (protected)
router.get('/status', protect, dojahController.getVerificationStatus);

module.exports = router;
