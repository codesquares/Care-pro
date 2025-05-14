const express = require('express');
const {
  startKYC,
  getQuestions,
  generateProviderQuestions,
  submitResponses,
  evalResponse,
  createVerificationSession,
  verifyNIN,
  verifyBVN,
  verifyAddress,
  getVerificationStatus
} = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Assessment routes - all protected
router.post('/start', protect, startKYC);
router.get('/questions', protect, getQuestions);
router.post('/generate-questions', protect, generateProviderQuestions);
router.post('/submit', protect, submitResponses);
router.post('/evaluate', protect, evalResponse);

// Identity verification routes - all protected
router.post('/verification-session', protect, createVerificationSession);
router.post('/verify-nin', protect, verifyNIN);
router.post('/verify-bvn', protect, verifyBVN);
router.post('/verify-address', protect, verifyAddress);

// Get verification status
router.get('/status', protect, getVerificationStatus);

module.exports = router;