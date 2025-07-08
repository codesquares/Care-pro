const express = require('express');
const {
  startKYC,
  getQuestions,
  generateProviderQuestions,
  submitResponses,
  evalResponse,
  createVerificationSession,
  generateQuestionBank
} = require('../controllers/kycController');
const {
  verifyNIN,
  verifyBVN,
  getVerificationStatus,
  verifyBVNWithIdSelfie,
  verifyNINWithSelfie
} = require('../controllers/verificationController');
const verifyIdSelfie = require('../controllers/idSelfieController');
const verifyAddress = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Assessment routes - all protected
router.post('/start', protect, startKYC);
router.get('/questions', protect, getQuestions);
router.post('/generate-questions', protect, generateProviderQuestions);
router.post('/submit', protect, submitResponses);
router.post('/evaluate', protect, evalResponse);
router.post('/generate-question-bank', protect, generateQuestionBank);

// Identity verification routes - all protected
router.post('/verification-session', protect, createVerificationSession);
router.post('/verify-nin', protect, verifyNIN);
router.post('/verify-bvn', protect, verifyBVN);
router.post('/verify-address', protect, verifyAddress);
router.post('/verify-id-selfie', protect, verifyIdSelfie);

// Combined verification routes
router.post('/verify-bvn-with-id-selfie', protect, verifyBVNWithIdSelfie);
router.post('/verify-nin-with-selfie', protect, verifyNINWithSelfie);

// Get verification status
router.get('/status', protect, getVerificationStatus);

module.exports = router;