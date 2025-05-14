const express = require('express');
const { 
  createServiceRequest,
  getClientServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
  getMatchedProviders,
  selectProvider,
  getProviderServiceRequests,
  respondToServiceRequestMatch
} = require('../controllers/clientServiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Client routes
router.post('/create', restrictTo('client'), createServiceRequest);
router.get('/my-requests', restrictTo('client'), getClientServiceRequests);
router.get('/request/:requestId', getServiceRequestById);
router.patch('/update/:requestId', restrictTo('client'), updateServiceRequest);
router.patch('/cancel/:requestId', restrictTo('client'), cancelServiceRequest);
router.get('/matches/:requestId', restrictTo('client'), getMatchedProviders);
router.post('/select-provider/:requestId/:providerId', restrictTo('client'), selectProvider);

// Provider routes
router.get('/provider-requests', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), getProviderServiceRequests);
router.post('/respond/:requestId', restrictTo('caregiver', 'nurse', 'doctor', 'dietician'), respondToServiceRequestMatch);

module.exports = router;
