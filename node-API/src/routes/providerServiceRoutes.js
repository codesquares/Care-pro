const express = require('express');
const {
  createOrUpdateProviderService,
  getProviderServiceById,
  getMyProviderService,
  findProviders,
  updateAvailability,
  addProviderReview,
  toggleActiveStatus,
  getRecommendedRequests
} = require('../controllers/providerServiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for finding providers (clients can search without being logged in)
router.post('/find', findProviders);
router.get('/view/:providerId', getProviderServiceById);

// Protected routes - require authentication
router.use(protect);

// Provider routes - only for healthcare providers
router.post('/create-update', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), createOrUpdateProviderService);
router.get('/my-service', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), getMyProviderService);
router.patch('/update-availability', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), updateAvailability);
router.patch('/toggle-active', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), toggleActiveStatus);
router.get('/recommended-requests', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), getRecommendedRequests);

// Client routes - only for clients (to add reviews)
router.post('/review/:providerId', restrictTo('client'), addProviderReview);

module.exports = router;
