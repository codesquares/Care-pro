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
              
              // Use the API endpoint for assessment questions
              // Remove the leading /api since the baseURL already includes it
              // Using the correct plural endpoint: /Assessments/questions/{userType}
              const response = await api.get(
                `/Assessments/questions/${normalizedUserType}`, 
                { 
                  headers: { Authorization: `Bearer ${token}` },
                  signal,
                }
              );
              
              // Clear the timeout since request completed successfully
              fetchTimeout.clear();
              
              // Reset the pending request
              pendingQuestionRequest = null;
              
              // Handle both old and new response formats
              if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // The API provides data in the wrapped format (success + data)
                return response.data;
              } else if (Array.isArray(response.data)) {
                // The API returns directly an array of questions
                console.log('Converting raw question array to expected format');
                return {
                  success: true,
                  data: response.data,
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
        // Submit to the exact endpoint

        const response = await api.post(
          '/Assessments', 
          assessmentData, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Process the API response
        // The API may return just an ID or the full assessment object
        let result = {};
        const assessmentId = typeof response.data === 'string' ? response.data : (response.data.id || '');
        
        if (assessmentId) {
          console.log(`Assessment submitted successfully with ID: ${assessmentId}`);
          
          try {
            // Wait for a brief moment to let the backend process the assessment
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use our dedicated method to calculate the score for this assessment
            console.log(`Calculating score for assessment ID: ${assessmentId}`);
            const scoreResult = await assessmentService.calculateAssessmentScore(assessmentId);
            
            if (scoreResult.success) {
              result = scoreResult.data;
              console.log(`Retrieved assessment score: ${result.score}%, Passed: ${result.passed}`);
            } else {
              console.warn("Failed to calculate score, using basic information");
              result = {
                id: assessmentId,
                score: 0,
                passed: false
              };
            }
          } catch (fetchError) {
            console.warn("Error fetching assessment details:", fetchError);
            // If fetch fails, use basic info
            result = {
              id: assessmentId,
              score: 0,
              passed: false
            };
          }
        }
        // If response contains the full assessment object
        else if (response.data) {
          result = {
            id: response.data.id || '',
            score: response.data.score || 0,
            passed: response.data.passed || false
          };
        }
        
        // Update the assessment attempt count tracking
        const attemptHistory = JSON.parse(localStorage.getItem('assessmentAttempts') || '{"attempts": [], "count": 0}');
        attemptHistory.attempts.push({
          date: new Date().toISOString(),
          score: result.score,
          passed: result.passed,
          assessmentId: result.id
        });
        attemptHistory.count = attemptHistory.attempts.length;
        localStorage.setItem('assessmentAttempts', JSON.stringify(attemptHistory));
        
        // Cache the most recent result
        localStorage.setItem('lastAssessmentResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          score: result.score,
          passed: result.passed,
          attemptNumber: attemptHistory.count
        }));
          
          return {
            success: true,
            data: result
          };
        
        // If no valid result data
        if (!response.data) {
          console.warn('Invalid assessment result format:', response.data);
          throw new Error('Invalid assessment result format');
        }
      } catch (err) {
        console.error('Error submitting assessment to API:', err);

        throw err;
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
      // Try to get more information about the API request
      if (err.isAxiosError) {
        console.error('Axios error details:', err.response?.data);
      }
      throw err;
    }
  },

  /**
   * Calculate or fetch the score for a specific assessment
   * @param {string} assessmentId - The ID of the assessment to calculate score for
   * @returns {Promise<Object>} - The assessment result with score and pass status
   */
  calculateAssessmentScore: async (assessmentId) => {
    try {
      if (!assessmentId) {
        throw new Error('Assessment ID is required');
      }
      
      console.log(`Calculating score for assessment ID: ${assessmentId}`);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Call the specific calculate-score endpoint
      const response = await api.post(
        `/Assessments/calculate-score/${assessmentId}`, 
        {}, // Empty body for POST request
        { headers: { Authorization: `Bearer ${token}` } }
      );
      

      
      if (response.data) {
        // Extract score and passing status
        let score = 0;
        let passed = false;
        
        // Check different possible response structures
        if (typeof response.data.score === 'number') {
          score = response.data.score;
          passed = response.data.passed !== undefined ? response.data.passed : (score >= 70);
        } 
        // Check if the response contains the score under data property
        else if (response.data.data && typeof response.data.data.score === 'number') {
          score = response.data.data.score;
          passed = response.data.data.passed !== undefined ? response.data.data.passed : (score >= 70);
        }
        
        // Update the last assessment result in localStorage
        const lastResult = JSON.parse(localStorage.getItem('lastAssessmentResult') || '{}');
        if (lastResult && lastResult.timestamp) {
          lastResult.score = score;
          lastResult.passed = passed;
          localStorage.setItem('lastAssessmentResult', JSON.stringify(lastResult));
        }
        
        return {
          success: true,
          data: {
            id: assessmentId,
            score: score,
            passed: passed
          }
        };
      } else {
        throw new Error('Invalid response format from calculate-score endpoint');
      }
    } catch (err) {
      console.error('Error calculating assessment score:', err);
      return {
        success: false,
        error: err.message,
        data: {
          id: assessmentId,
          score: 0,
          passed: false
        }
      };
    }
  },

  /**
   * Gets the user's qualification status from the API
   * @param {string} careGiverId - The caregiver ID to check status for
   * @returns {Promise<Object>} - The qualification status
   */
  getQualificationStatus: async (careGiverId) => {
    try {
      if (!careGiverId) {
        throw new Error('CareGiver ID is required');
      }

      const apiUrl = `${config.BASE_URL}/Assessments/user/${careGiverId}`; // Using centralized API config

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const assessmentData = await response.json();

      // Check if assessment exists, using the assessedDate field, check the last assessment and see if the score is 70 or above
      // check if assessmentData is an array and has at least one entry
      // check if the last entry in the array has a score >= 70, if it has one entry then just check its score, if it does not have an entry and returns that the user has not been verified, just return status as awaiting assessment
      if (Array.isArray(assessmentData) && assessmentData.length > 0) {
        const lastAssessment = assessmentData[0];
        const isQualified = lastAssessment.score >= 70;

        return {
          isQualified,
          assessmentCompleted: true,
          score: lastAssessment.score,
          canRetake: !isQualified, // Can retake if not qualified
          assessmentData: assessmentData, // Include full assessment data
          fetchedFromAPI: true
        };
      } else {
        // No assessment found or no score available
        return {
          isQualified: false,
          assessmentCompleted: false,
          canRetake: true,
          score: null,
          assessmentData: assessmentData,
          fetchedFromAPI: true
        };
      }
    } catch (err) {
      console.error('Error getting qualification status from API:', err);
      return {
        isQualified: false,
        assessmentCompleted: false,
        canRetake: true,
        error: err.message,
        fetchedFromAPI: false
      };
    }
  }
};

export default assessmentService;
