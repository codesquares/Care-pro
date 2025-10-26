/**
 * Assessment Controller
 * 
 * Handles assessment-related API requests and forwards them to the C# backend
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { handleError } = require('../utils/errorHandler');

// Create a namespaced logger
const assessmentLogger = logger.createLogger('assessment-controller');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5145'; // C# backend API URL

/**
 * Get questions for assessment based on user type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAssessmentQuestions(req, res) {
  const { userType } = req.params;
  
  // Validate user type
  if (!userType || !['Caregiver', 'Cleaner'].includes(userType)) {
    return res.status(400).json({
      success: false,
      message: "User type must be either 'Caregiver' or 'Cleaner'"
    });
  }
  
  try {
    // Forward request to C# backend
    const response = await axios.get(`${API_URL}/api/Assessments/questions/${userType}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    
    // Format questions to match frontend expectations
    const formattedQuestions = response.data.map(q => ({
      id: q.id,
      text: q.question,
      type: 'radio',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      category: q.category || '',
      explanation: q.explanation || ''
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedQuestions,
      fromAPI: true
    });
    
  } catch (error) {
    assessmentLogger.error(`Error getting assessment questions: ${error.message}`);
    return handleError(res, error, 'Error fetching assessment questions');
  }
}

/**
 * Submit assessment answers and get results
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitAssessment(req, res) {
  const assessmentData = req.body;
  
  // Validate request body
  if (!assessmentData || !assessmentData.userId || !assessmentData.questions) {
    return res.status(400).json({
      success: false,
      message: "Invalid assessment data. UserId and questions are required."
    });
  }
  
  try {
    // Format the request for the C# backend
    const formattedRequest = {
      userId: assessmentData.userId,
      caregiverId: assessmentData.userId, // Using userId as caregiverId for now
      userType: assessmentData.userType || 'Caregiver',
      questions: assessmentData.questions.map(q => ({
        questionId: q.id,
        userAnswer: q.answer
      })),
      status: 'Completed',
      score: 0 // Will be calculated by the backend
    };
    
    // Submit to C# backend
    const submitResponse = await axios.post(
      `${API_URL}/api/Assessments`,
      formattedRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        }
      }
    );
    
    // Get the assessment ID from the response
    const assessmentId = submitResponse.data;
    
    // Retrieve the calculated assessment results
    const resultsResponse = await axios.get(
      `${API_URL}/api/Assessments/${assessmentId}`,
      {
        headers: {
          'Authorization': req.headers.authorization || ''
        }
      }
    );
    
    // Format the response for the frontend
    const assessment = resultsResponse.data;
    return res.status(200).json({
      success: true,
      data: {
        score: assessment.score,
        passed: assessment.passed,
        timestamp: assessment.endTimestamp
      }
    });
    
  } catch (error) {
    assessmentLogger.error(`Error submitting assessment: ${error.message}`);
    return handleError(res, error, 'Error submitting assessment');
  }
}

/**
 * Get assessment history for a user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getUserAssessmentHistory(req, res) {
  const { userId } = req.params;
  
  try {
    // Forward request to C# backend
    const response = await axios.get(`${API_URL}/api/Assessments/user/${userId}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    
    // Format the assessments for the frontend
    const formattedAssessments = response.data.map(a => ({
      id: a.id,
      timestamp: a.endTimestamp,
      score: a.score,
      passed: a.passed,
      userType: a.userType
    }));
    
    return res.status(200).json({
      success: true,
      data: formattedAssessments
    });
    
  } catch (error) {
    assessmentLogger.error(`Error getting user assessment history: ${error.message}`);
    return handleError(res, error, 'Error fetching assessment history');
  }
}

/**
 * Get a specific assessment by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAssessmentById(req, res) {
  const { id } = req.params;
  
  try {
    // Forward request to C# backend
    const response = await axios.get(`${API_URL}/api/Assessments/${id}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    assessmentLogger.error(`Error getting assessment by ID: ${error.message}`);
    return handleError(res, error, 'Error fetching assessment');
  }
}

module.exports = {
  getAssessmentQuestions,
  submitAssessment,
  getUserAssessmentHistory,
  getAssessmentById
};
