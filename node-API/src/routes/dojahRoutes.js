const express = require('express');
const router = express.Router();
const { protect, protectAdmin } = require('../middleware/authMiddleware');
const dojahController = require('../controllers/dojahVerificationController');

// Middleware for webhook route if we need raw body later
// const rawBodyParser = express.raw({ type: 'application/json' });

// Webhook endpoint (no auth middleware as Dojah needs direct access)
// Using regular JSON parsing for now (not raw body)
router.post('/webhook', dojahController.handleDojahWebhook);
router.get('/webhook', dojahController.handleGetDojahWebhook);

// Save verification data endpoint (protected)
router.post('/save', protect, dojahController.saveVerificationData);

// Get webhook data endpoint (protected) - NEW
router.get('/data/:userId', protect, dojahController.getWebhookData);

// Process webhook data and send to Azure endpoint (protected) - NEW
router.post('/process/:userId', protect, dojahController.processWebhookToAzure);

// Retry Azure submission endpoint (protected) - NEW
router.post('/retry/:userId', protect, dojahController.retryAzureSubmission);

// Get verification status endpoint (protected)
router.get('/status', protect, dojahController.getVerificationStatus);

// Admin endpoints (protected - requires admin role)
router.get('/admin/all-data', protectAdmin,dojahController.getAllWebhookData);
router.get('/admin/statistics', protectAdmin, dojahController.getWebhookStatistics);
router.get('/admin/health', protectAdmin, dojahController.getWebhookSystemHealth);

module.exports = router;
