const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getUserVerificationStatus,
  syncVerificationStatus
} = require('../controllers/integrationController');

const router = express.Router();

// Routes for Azure API integration
// These endpoints are secured with a special API key middleware
router.get('/verification-status/:userId', protect, getUserVerificationStatus);
router.post('/sync-verification', protect, syncVerificationStatus);

module.exports = router;
