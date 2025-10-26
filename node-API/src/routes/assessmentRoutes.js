const express = require('express');
const router = express.Router();
const assessmentAuth = require('../middleware/assessmentAuthMiddleware');
const assessmentController = require('../controllers/assessmentController');

/**
 * @route GET /api/assessment/questions/:userType
 * @desc Get questions for assessment
 * @access Private
 */
router.get('/questions/:userType', assessmentAuth, assessmentController.getAssessmentQuestions);

/**
 * @route POST /api/assessment/submit
 * @desc Submit caregiver assessment
 * @access Private
 */
router.post('/submit', assessmentAuth, assessmentController.submitAssessment);

/**
 * @route GET /api/assessment/history/:userId
 * @desc Get assessment history for a user
 * @access Private
 */
router.get('/history/:userId', assessmentAuth, assessmentController.getUserAssessmentHistory);

/**
 * @route GET /api/assessment/:id
 * @desc Get a specific assessment by ID
 * @access Private
 */
router.get('/:id', assessmentAuth, assessmentController.getAssessmentById);

// Legacy routes below are kept for backward compatibility but are now deprecated

module.exports = router;
