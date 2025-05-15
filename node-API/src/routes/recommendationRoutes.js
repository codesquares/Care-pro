// src/routes/recommendationRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getRecommendationsForClient,
  getClientMatchesForCaregiver
} = require('../controllers/recommendationController');

const router = express.Router();

// Get recommendations for a client
router.post('/client-recommendations', protect, getRecommendationsForClient);

// Get client matches for a caregiver
router.get('/caregiver-matches', protect, getClientMatchesForCaregiver);

module.exports = router;
