const express = require('express');
const router = express.Router();
const assessmentAuth = require('../middleware/assessmentAuthMiddleware');

// In-memory storage for assessment data until external API is available
let assessmentStorage = [];

/**
 * @route POST /api/assessment/submit
 * @desc Submit caregiver assessment
 * @access Private
 */
router.post('/submit', assessmentAuth, (req, res) => {
  try {
    const { userId, timestamp, questions } = req.body;

    // Validation
    if (!userId || !timestamp || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment data format'
      });
    }

    // Create assessment record
    const assessmentRecord = {
      id: `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      userId,
      timestamp,
      questions,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Store assessment in memory until external API is ready
    assessmentStorage.push(assessmentRecord);

    // Log assessment data for debugging
    console.log(`Assessment submitted for user ${userId} with ${questions.length} questions`);

    return res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      assessmentId: assessmentRecord.id
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during assessment submission',
      error: error.message
    });
  }
});

/**
 * @route GET /api/assessment/history
 * @desc Get assessment history for a user
 * @access Private
 */
router.get('/history', assessmentAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Filter assessments for this user
    const userAssessments = assessmentStorage.filter(a => a.userId === userId);

    return res.status(200).json({
      success: true,
      data: userAssessments
    });
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment history',
      error: error.message
    });
  }
});

/**
 * @route POST /api/assessment/batch-submit
 * @desc Submit multiple cached assessments
 * @access Private
 */
router.post('/batch-submit', assessmentAuth, (req, res) => {
  try {
    const { assessments } = req.body;

    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid batch assessment data'
      });
    }

    // Process each assessment
    const processed = assessments.map(assessment => {
      const record = {
        id: `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        ...assessment,
        status: 'completed',
        createdAt: new Date().toISOString(),
        syncedFromCache: true
      };

      assessmentStorage.push(record);
      return record.id;
    });

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${processed.length} cached assessments`,
      processedIds: processed
    });
  } catch (error) {
    console.error('Error processing batch assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during batch processing',
      error: error.message
    });
  }
});

/**
 * @route GET /api/assessment/count
 * @desc Get assessment count for administrative purposes
 * @access Private
 */
router.get('/count', assessmentAuth, (req, res) => {
  try {
    // Only allow admins to access this endpoint (add role check if available)
    const totalCount = assessmentStorage.length;
    
    return res.status(200).json({
      success: true,
      count: totalCount
    });
  } catch (error) {
    console.error('Error counting assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while counting assessments',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/assessment/clear-test-data
 * @desc Clear test assessment data (for development only)
 * @access Private - Admin only
 */
router.delete('/clear-test-data', assessmentAuth, (req, res) => {
  try {
    // This should be restricted to admins or development environments
    const originalCount = assessmentStorage.length;
    assessmentStorage = [];
    
    return res.status(200).json({
      success: true,
      message: `Cleared ${originalCount} assessment records`,
    });
  } catch (error) {
    console.error('Error clearing assessment data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while clearing assessment data',
      error: error.message
    });
  }
});

module.exports = router;
