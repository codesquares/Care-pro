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
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Client routes
router.post('/create', createServiceRequest);
router.get('/my-requests', getClientServiceRequests);
router.get('/request/:requestId', getServiceRequestById);
router.patch('/update/:requestId', updateServiceRequest);
router.patch('/cancel/:requestId', cancelServiceRequest);
router.get('/matches/:requestId', getMatchedProviders);
router.post('/select-provider/:requestId/:providerId',selectProvider);

// Provider routes
router.get('/provider-requests',getProviderServiceRequests);
router.post('/respond/:requestId',  respondToServiceRequestMatch);

module.exports = router;
