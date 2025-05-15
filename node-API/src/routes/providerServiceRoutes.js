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
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for finding providers (clients can search without being logged in)
router.post('/find', findProviders);
router.get('/view/:providerId', getProviderServiceById);

// Protected routes - require authentication
router.use(protect);

// Provider routes - only for healthcare providers
router.post('/create-update', createOrUpdateProviderService);
router.get('/my-service', getMyProviderService);
router.patch('/update-availability', updateAvailability);
router.patch('/toggle-active', toggleActiveStatus);
router.get('/recommended-requests', getRecommendedRequests);

// Client routes - only for clients (to add reviews)
router.post('/review/:providerId', addProviderReview);

module.exports = router;
