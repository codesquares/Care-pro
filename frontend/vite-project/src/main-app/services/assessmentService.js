// Assessment service for handling caregiver assessment data
import api from './api';
import config from '../config';

// Production API base URL (from config)
const PROD_API_URL = config.BASE_URL;

// In-memory cache of assessment submissions
let assessmentCache = [];

// Flag to track pending question request to prevent multiple simultaneous API calls
let pendingQuestionRequest = null;
let requestTimeoutId = null;

// Helper function to create timeout handlers for fetch operations
const createTimeoutHandler = (controller, errorMessage, timeoutMs) => {
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn(errorMessage);
  }, timeoutMs);
  
  return {
    clear: () => clearTimeout(timeoutId),
    id: timeoutId
  };
};

// Helper function to log assessment data for debugging
const logAssessment = (assessmentData) => {
  console.log('Assessment submission:', {
    userId: assessmentData.userId,
    timestamp: new Date().toISOString(),
    questionCount: assessmentData.questions ? assessmentData.questions.length : 0
  });
};

// Main assessment service
const assessmentService = {
  /**
   * Gets assessment questions for the specified user type from the API
   * @param {string} userType - The type of user (caregiver, cleaner)
   * @param {Object} options - Options object including AbortController signal
   * @returns {Promise<Array>} - Array of assessment questions
   */
  getAssessmentQuestions: async (userType = 'caregiver', options = {}) => {
    try {
      // If there's already a pending request, return it instead of making a new one
      if (pendingQuestionRequest) {
        console.log('Using existing pending request for assessment questions');
        
        // Set a new timeout that will reset the pending request if it takes too long
        if (requestTimeoutId) {
          clearTimeout(requestTimeoutId);
        }
        
        requestTimeoutId = setTimeout(() => {
          console.warn('Pending request took too long, resetting for future calls');
          pendingQuestionRequest = null;
          requestTimeoutId = null;
        }, 25000); // 25 second maximum wait time for pending request
        
        return pendingQuestionRequest;
      }
      
      // Create a new request promise and store it
      pendingQuestionRequest = (async () => {
        try {
          // Try to fetch questions from the backend API
          const token = localStorage.getItem('authToken');
          if (token) {
            try {
              console.log('Fetching assessment questions from API...');
              
              // Set up abort controller for timeouts
              const controller = new AbortController();
              const signal = options.signal || controller.signal;
              
              // Create a timeout handler that will abort the fetch after 15 seconds
              const fetchTimeout = createTimeoutHandler(
                controller,
                'API request for assessment questions timed out after 15 seconds',
                15000
              );
              
              // Normalize user type to match backend expectations (capitalize first letter)
              const normalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1);
              
              // Use the new backend endpoint for the question bank
              const response = await api.get(
                `/api/assessment/questions/${normalizedUserType}`, 
                { 
                  headers: { Authorization: `Bearer ${token}` },
                  signal,
                }
              );
              
              // Clear the timeout since request completed successfully
              fetchTimeout.clear();
              
              // Reset the pending request
              pendingQuestionRequest = null;
              
              if (response.data && Array.isArray(response.data)) {
                // Format the data to match our frontend structure
                const formattedQuestions = response.data.map((q, index) => ({
                  id: q.questionId || q.id,
                  text: q.question,
                  type: 'radio', // All questions are now multiple choice
                  options: q.options || [], // A, B, C, D options
                  correctAnswer: q.correctAnswer, // The correct answer (A, B, C, D)
                  category: q.category,
                  explanation: q.explanation || ''
                }));
                
                return {
                  success: true,
                  data: formattedQuestions,
                  fromAPI: true
                };
              } else {
                console.warn('API returned invalid question format:', response.data);
                throw new Error('Invalid question format received from API');
              }
            } catch (err) {
              // If aborted, don't log an error (this is expected behavior)
              if (err.name === 'AbortError') {
                console.log('Question request was aborted');
              } else {
                console.error('Error fetching questions from API:', err);
              }
              
              throw err;
            }
          } else {
            throw new Error('No authentication token available');
          }
        } catch (err) {
          // Reset the pending request
          pendingQuestionRequest = null;
          
          // If this is not a network error, try to load from cached questions
          const cachedQuestionsJson = localStorage.getItem('assessmentQuestions');
          if (cachedQuestionsJson) {
            try {
              const cachedQuestions = JSON.parse(cachedQuestionsJson);
              console.warn('Using cached questions due to API error:', err.message);
              return {
                success: true,
                data: cachedQuestions,
                cachedOnly: true
              };
            } catch (cacheErr) {
              console.error('Error parsing cached questions:', cacheErr);
            }
          }
          
          // If we get here, both API and cache failed
          throw err;
        }
      })();
      
      return pendingQuestionRequest;
    } catch (err) {
      console.error('Unexpected error in getAssessmentQuestions:', err);
      throw err;
    }
  },

  /**
   * Submits assessment answers to the API for evaluation
   * @param {Object} assessmentData - The assessment data and answers
   * @returns {Promise<Object>} - The assessment result
   */
  submitAssessment: async (assessmentData) => {
    try {
      logAssessment(assessmentData);
      
      // Format the submission for the updated backend API
      const submission = {
        userId: assessmentData.userId,
        caregiverId: assessmentData.userId, // Same as userId for now
        userType: assessmentData.userType,
        questions: assessmentData.questions.map(q => ({
          questionId: q.id,
          userAnswer: q.answer
        })),
        status: 'Completed'
      };
      
      // Add to in-memory cache (useful for debugging)
      assessmentCache.push({
        timestamp: new Date().toISOString(),
        data: assessmentData
      });
      
      // Submit to backend API
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      try {
        // Submit to the backend API
        const response = await api.post(
          '/api/assessment/submit', 
          submission,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // The API should return a result with a score and passed status
        if (response.data && typeof response.data.score !== 'undefined') {
          // Cache the most recent result
          localStorage.setItem('lastAssessmentResult', JSON.stringify({
            timestamp: new Date().toISOString(),
            score: response.data.score,
            passed: response.data.passed
          }));
          
          return {
            success: true,
            data: response.data
          };
        } else {
          console.warn('Invalid assessment result format:', response.data);
          throw new Error('Invalid assessment result format');
        }
      } catch (err) {
        console.error('Error submitting assessment to API:', err);
        
        // For testing only - simulate a valid response
        // REMOVE THIS IN PRODUCTION
        console.warn('Using simulated assessment result for testing');
        
        // Calculate a simulated score based on random performance
        // Will be removed once the API is fully functional
        const correctCount = assessmentData.questions.length * (Math.random() * 0.5 + 0.5); // 50-100% correct
        const score = Math.round((correctCount / assessmentData.questions.length) * 100);
        const passed = score >= 70; // Using new 70% threshold
        
        const simulatedResult = {
          score,
          passed,
          timestamp: new Date().toISOString()
        };
        
        // Store simulated result in localStorage
        localStorage.setItem('lastAssessmentResult', JSON.stringify(simulatedResult));
        
        return {
          success: true,
          data: simulatedResult,
          simulated: true // Flag to indicate this is a simulated result
        };
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
      throw err;
    }
  },

  /**
   * Gets the user's qualification status from localStorage
   * @returns {Object} - The qualification status
   */
  getQualificationStatus: () => {
    try {
      const storedStatus = localStorage.getItem('qualificationStatus');
      if (storedStatus) {
        const status = JSON.parse(storedStatus);
        
        // Check if user can retake the assessment
        if (status.canRetakeAfter) {
          const retakeDate = new Date(status.canRetakeAfter);
          const now = new Date();
          status.canRetake = now >= retakeDate;
        } else {
          status.canRetake = !status.isQualified; // Can retake if not qualified
        }
        
        return status;
      }
      
      // Default status if none found
      return {
        isQualified: false,
        assessmentCompleted: false,
        canRetake: true
      };
    } catch (err) {
      console.error('Error getting qualification status:', err);
      return {
        isQualified: false,
        assessmentCompleted: false,
        canRetake: true,
        error: err.message
      };
    }
  }
};

export default assessmentService;
