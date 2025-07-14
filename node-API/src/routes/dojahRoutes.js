const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const dojahController = require('../controllers/dojahVerificationController');

// Middleware for webhook route if we need raw body later
// const rawBodyParser = express.raw({ type: 'application/json' });

// Webhook endpoint (no auth middleware as Dojah needs direct access)
// Using regular JSON parsing for now (not raw body)
router.post('/webhook', dojahController.handleDojahWebhook);
router.get('/webhook', dojahController.handleGetDojahWebhook);

// Save verification data endpoint (protected)
router.post('/save', protect, dojahController.saveVerificationData);

// Get verification status endpoint (protected)
router.get('/status', protect, dojahController.getVerificationStatus);

module.exports = router;
