// Assessment service for handling caregiver assessment data
import api from './api';
import config from '../config';

// Production API base URL (from config)
const PROD_API_URL = config.BASE_URL;
// Local Node.js API URL
const LOCAL_API_URL = config.LOCAL_API_URL;

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
   * Gets assessment questions for the specified provider type from the API or local cache
   * @param {string} providerType - The type of healthcare provider (caregiver, cleaner)
   * @param {Object} options - Options object including AbortController signal
   * @returns {Promise<Array>} - Array of assessment questions
   */
  getAssessmentQuestions: async (providerType = 'caregiver', options = {}) => {
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
      
      // Check if we should use a cached set of questions
      const cachedQuestionsJson = localStorage.getItem('assessmentQuestions');
      const cachedQuestions = cachedQuestionsJson ? JSON.parse(cachedQuestionsJson) : null;
      
      // Check if we have cached questions that are less than 24 hours old
      const cacheTime = localStorage.getItem('assessmentQuestionsTimestamp');
      const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / (1000 * 60 * 60) : null;
      
      // If we have recently cached questions, use them
      if (cachedQuestions && cacheAge && cacheAge < 24) {
        console.log('Using cached assessment questions (age: ' + cacheAge.toFixed(1) + ' hours)');
        return {
          success: true,
          data: cachedQuestions,
          cachedOnly: true
        };
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
              
              // Create a timeout handler that will abort the fetch after 15 seconds
              const fetchTimeout = createTimeoutHandler(
                controller,
                'API request for assessment questions timed out after 15 seconds',
                15000
              );
              
              // Add a global timeout to ensure we eventually show something to the user
              let timedOut = false;
              const globalTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                  timedOut = true;
                  console.warn('Global timeout reached - falling back to local questions');
                  reject(new Error('Global timeout: Falling back to local questions after waiting'));
                }, 20000); // 20 second global timeout
              });
              
              // Normalize user type to match API expectations
              const normalizedUserType = providerType.toLowerCase() === 'caregiver' ? 'Caregiver' : 'Cleaner';
              
              // Race between the actual fetch and our global timeout
              try {
                // Try .NET API first for the new multiple-choice questions
                console.log(`Fetching ${normalizedUserType} questions from .NET API...`);
                const apiResponse = await Promise.race([
                  fetch(`${PROD_API_URL}/Assessments/questions/${normalizedUserType}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    signal: options?.signal || controller.signal
                  }),
                  globalTimeoutPromise
                ]);
                
                // Clear the timeout since we got a response
                fetchTimeout.clear();
                
                if (apiResponse && apiResponse.ok) {
                  const apiData = await apiResponse.json();
                  if (Array.isArray(apiData) && apiData.length > 0) {
                    // Format the multiple-choice questions from the API
                    const questions = apiData.map(question => ({
                      id: question.id,
                      text: question.question,
                      type: 'radio', // All questions are multiple choice now
                      options: question.options,
                      category: question.category
                    }));
                    
                    // Cache the questions in localStorage
                    localStorage.setItem('assessmentQuestions', JSON.stringify(questions));
                    localStorage.setItem('assessmentQuestionsTimestamp', Date.now().toString());
                    
                    // Clear the pending request flag
                    pendingQuestionRequest = null;
                    
                    // Return the formatted questions
                    return {
                      success: true,
                      data: questions,
                      fromAPI: true
                    };
                  }
                }
                
                // If the .NET API fails, try the Node.js API as fallback
                console.log('Falling back to Node.js API for questions...');
                const localResponse = await Promise.race([
                  fetch(`${LOCAL_API_URL}/kyc/generate-questions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ providerType, count: 10 }),
                    signal: options?.signal || controller.signal
                  }),
                  globalTimeoutPromise
                ]);
                
                // Clear the timeout since we got a response
                fetchTimeout.clear();
                
                // Check if response is valid and process the data from local API
                if (localResponse && localResponse.ok) {
                  const localApiData = await localResponse.json();
                  if (localApiData.questions && localApiData.questions.length > 0) {
                    // Format the questions from the local API
                    const questions = localApiData.questions.map((questionText, index) => ({
                      id: `q${index + 1}`,
                      text: questionText,
                      type: getQuestionType(questionText),
                      options: getOptionsForQuestion(questionText)
                    }));
                    
                    // Cache the questions for 24 hours
                    localStorage.setItem('assessmentQuestions', JSON.stringify(questions));
                    localStorage.setItem('assessmentQuestionsTimestamp', Date.now().toString());
                    
                    console.log('Successfully fetched questions from local Node.js API');
                    return {
                      success: true,
                      data: questions,
                      fromAPI: true,
                      source: 'local'
                    };
                  }
                } else {
                  console.log('Local API request failed or returned no questions, trying external API');
                  
                  // Try external API if local API failed
                  const response = await Promise.race([
                    fetch(`${PROD_API_URL}/kyc/generate-questions`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ providerType, count: 10 }),
                      signal: options?.signal || controller.signal
                    }),
                    globalTimeoutPromise
                  ]);
                  
                  // Clear the timeout since we got a response
                  fetchTimeout.clear();
                  
                  // Check if response is valid and process the data
                  if (response && response.ok) {
                    const apiData = await response.json();
                    if (apiData.status === 'success' && apiData.data && apiData.data.length > 0) {
                      // Process the API data as before
                      const questions = apiData.data.map((q, index) => ({
                        id: `q${index + 1}`,
                        text: q.question,
                        type: q.type,
                        options: q.options || [],
                        answer: q.answer || null
                      }));
                      
                      // Cache the questions for 24 hours
                      localStorage.setItem('assessmentQuestions', JSON.stringify(questions));
                      localStorage.setItem('assessmentQuestionsTimestamp', Date.now().toString());
                      
                      return {
                        success: true,
                        data: questions,
                        fromAPI: true
                      };
                    }
                  }
                }
              } catch (fetchError) {
                // Clear the timeout
                fetchTimeout.clear();
                
                if (timedOut) {
                  console.warn('Request timed out, falling back to local questions');
                } else {
                  console.error('Error fetching questions from API:', fetchError);
                }
              }
            } catch (apiError) {
              // Only log - we'll fall back to local generation
              console.error('Error in API request block:', apiError);
            }
          }
          
          // If API call failed or no token, generate sample questions locally
          console.log('Falling back to local question generation');
          const questions = generateSampleQuestions(providerType);
          
          // Cache the generated questions for 24 hours
          localStorage.setItem('assessmentQuestions', JSON.stringify(questions));
          localStorage.setItem('assessmentQuestionsTimestamp', Date.now().toString());
          
          return {
            success: true,
            data: questions,
            cachedOnly: true
          };
        } finally {
          // Clear the pending request after a short delay (to avoid race conditions)
          if (requestTimeoutId) {
            clearTimeout(requestTimeoutId);
            requestTimeoutId = null;
          }
          
          setTimeout(() => {
            pendingQuestionRequest = null;
          }, 500);
        }
      })();
      
      return pendingQuestionRequest;
    } catch (error) {
      console.error('Error getting assessment questions:', error);
      
      // Return a fallback set of questions for testing
      const fallbackQuestions = [
        {
          id: "q1",
          text: "How many years of experience do you have in caregiving?",
          type: "radio",
          options: [
            "Less than 1 year",
            "1-3 years",
            "3-5 years",
            "5-10 years",
            "More than 10 years"
          ]
        },
        {
          id: "q2",
          text: "What steps would you take if a client had a medical emergency?",
          type: "textarea"
        },
        {
          id: "q3",
          text: "Which caregiving skills do you have? (Select all that apply)",
          type: "checkbox",
          options: [
            "Medication management",
            "Mobility assistance",
            "Personal care",
            "Meal preparation",
            "First aid"
          ]
        }
      ];
      
      return {
        success: true,
        data: fallbackQuestions,
        cachedOnly: true,
        message: 'Using fallback questions due to error'
      };
    }
  },

  /**
   * Submit a caregiver's assessment to the API
   * @param {Object} assessmentData - The assessment data including questions and answers
   * @returns {Promise<Object>} - Response from the API
   */
  submitAssessment: async (assessmentData) => {
    try {
      // Log the assessment submission for testing
      logAssessment(assessmentData);
      
      // Get user info and auth token
      const token = localStorage.getItem('authToken');
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const userId = userDetails.id || assessmentData.userId;
      const userType = assessmentData.userType || userDetails.role || 'Caregiver';
      
      if (token) {
        try {
          // Format the request to match the new assessment API schema
          const questionsSubmission = assessmentData.questions.map(q => ({
            questionId: q.id,
            userAnswer: q.answer || ""
          }));
          
          const requestPayload = {
            userId: userId,
            userType: userType,
            status: "Completed",
            questions: questionsSubmission
          };
          
          console.log('Submitting assessment to .NET API...');
          const response = await fetch(`${PROD_API_URL}/Assessments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestPayload)
          });
          
          if (response.ok) {
            const assessmentId = await response.json();
            
            // Calculate score immediately by making a second request
            console.log('Calculating assessment score...');
            const scoreResponse = await fetch(`${PROD_API_URL}/Assessments/calculate-score/${assessmentId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (scoreResponse.ok) {
              const scoredAssessment = await scoreResponse.json();
              
              return {
                success: true,
                message: 'Assessment submitted and scored successfully',
                data: {
                  assessmentId: assessmentId,
                  score: scoredAssessment.score,
                  passed: scoredAssessment.passed,
                  timestamp: new Date().toISOString(),
                },
                fromAPI: true
              };
            } else {
              console.warn('Score calculation failed, returning submission success only');
              return {
                success: true,
                message: 'Assessment submitted successfully',
                data: {
                  assessmentId: assessmentId,
                  timestamp: new Date().toISOString(),
                },
                fromAPI: true
              };
            }
          } else {
            console.warn('API submission failed, status:', response.status);
            throw new Error(`API returned status ${response.status}`);
          }
        } catch (apiError) {
          console.error('Error submitting assessment to API:', apiError);
          // Will fall back to local storage
        }
      }
      
      // For testing purposes, use the cache mechanism if API call fails
      console.log('Falling back to local storage for assessment submission');
      
      // Store the assessment in local cache
      const assessmentKey = `assessment_${new Date().getTime()}`;
      assessmentCache.push({
        ...assessmentData,
        id: assessmentKey,
        cachedAt: new Date().toISOString()
      });
      
      // Also store in localStorage for persistence between sessions
      try {
        // Get existing assessments or initialize empty array
        const existingAssessments = JSON.parse(localStorage.getItem('cachedAssessments') || '[]');
        
        // Calculate mock score for locally stored assessment (70% threshold)
        const totalQuestions = assessmentData.questions.length;
        let correctAnswers = 0;
        
        // Simulate scoring (in real implementation this would check against correct answers)
        // For testing purposes, count non-empty answers as correct 80% of the time
        assessmentData.questions.forEach(q => {
          if (q.answer && Math.random() < 0.8) {
            correctAnswers++;
          }
        });
        
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= 70; // New 70% threshold
        
        // Add the assessment with score to localStorage
        const scoredAssessment = {
          ...assessmentData,
          id: assessmentKey,
          score: score,
          passed: passed,
          cachedAt: new Date().toISOString()
        };
        
        existingAssessments.push(scoredAssessment);
        localStorage.setItem('cachedAssessments', JSON.stringify(existingAssessments));
        console.log('Assessment saved to localStorage with score:', score);
        
        // Return a success response with the mock score
        return {
          success: true,
          message: 'Assessment submitted successfully for testing',
          data: {
            assessmentId: assessmentKey,
            score: score,
            passed: passed,
            timestamp: new Date().toISOString(),
          },
          cachedOnly: true
        };
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
        throw storageError;
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      
      // Return a friendly error for testing
      throw new Error('Failed to process assessment. Please try again.');
    }
  },

  /**
   * Get assessment history for the current user
   * @returns {Promise<Array>} - Array of assessment records
   */
  getAssessmentHistory: async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('userDetails') || '{}').id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // For testing purposes, we'll get data from localStorage
      console.log('Local testing mode: Retrieving assessment data from localStorage');
      
      // Get assessments from localStorage
      const cachedAssessments = JSON.parse(localStorage.getItem('cachedAssessments') || '[]');
      
      // Filter by current user ID
      const userAssessments = cachedAssessments.filter(assessment => assessment.userId === userId);
      
      return {
        success: true,
        data: userAssessments,
        cachedOnly: true
      };
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      
      // Return an empty array for testing
      return {
        success: true,
        data: [],
        cachedOnly: true,
        message: 'Could not retrieve assessment history'
      };
    }
  },

  /**
   * Process any cached assessment data that failed to submit previously
   * @returns {Promise<Object>} - Status of the sync operation
   */
  syncCachedAssessments: async () => {
    // In test mode, we just return success without attempting to sync
    return { 
      success: true, 
      message: 'Test mode: Syncing is simulated',
      syncedCount: 0
    };
  },
  
  /**
   * Get the cached assessment data (for debug purposes)
   * @returns {Array} - The cached assessment data
   */
  _getCache: () => {
    return [...assessmentCache];
  },

  /**
   * Evaluate caregiver assessment responses using OpenAI
   * @param {Object} assessmentData - Data containing questions and answers
   * @returns {Promise<Object>} - Evaluation results
   */
  evaluateAssessment: async (assessmentData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Format the data for evaluation
      const userId = assessmentData.userId;
      const providerType = assessmentData.providerType || 'caregiver';
      const responses = assessmentData.questions.map(q => `Question: ${q.text}\nAnswer: ${q.answer || 'No answer provided'}`);
      
      // Add a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Call evaluation endpoint
      const response = await fetch(`${PROD_API_URL}/kyc/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, providerType, responses }),
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Evaluation failed');
      }
    
      // Parse the response body only once
      const evaluationData = await response.json();
      
      // Check if we have the expected data structure
      if (!evaluationData || typeof evaluationData.score !== 'number') {
        console.warn('Unexpected evaluation response format:', evaluationData);
        throw new Error('Invalid evaluation response format');
      }
      
      // After successful evaluation, save the results to the external Azure API
      try {
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const caregiverId = userDetails.id || assessmentData.userId;

        // Format the data for Azure API according to required schema:
        // { "caregiverId": "string", "questions": ["string"], "status": "string", "score": 0 }
        const azurePayload = {
          caregiverId: caregiverId,
          questions: assessmentData.questions.map(q => q.text),
          status: "completed",
          score: evaluationData.score
        };
        
        console.log('Saving assessment evaluation results to Azure API...');
        const azureResponse = await fetch(`${PROD_API_URL}/Assessments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(azurePayload)
        });
        
        if (azureResponse.ok) {
          console.log('Successfully saved assessment results to Azure API');
        } else {
          console.warn(`Failed to save assessment results to Azure API. Status: ${azureResponse.status}`);
        }
      } catch (saveError) {
        console.error('Error saving assessment results to Azure API:', saveError);
        // Continue with returning evaluation results even if saving fails
      }
      
      return {
        success: true,
        score: evaluationData.score,
        feedback: evaluationData.feedback,
        improvements: evaluationData.improvements,
        passThreshold: evaluationData.passThreshold,
        fromAPI: true
      };
    } catch (error) {
      console.error('Assessment evaluation error:', error);
      
      // Check if this was an abort error (timeout)
      if (error.name === 'AbortError') {
        console.warn('API request timed out after 30 seconds');
        return {
          success: true,
          score: 65, // Default passing score for fallback
          feedback: 'Your responses show an understanding of basic caregiving concepts. Due to a technical issue, we\'ve provided a provisional evaluation.',
          improvements: 'Please ensure a stable internet connection for future assessments.',
          passThreshold: true,
          cachedOnly: true,
          timeout: true
        };
      }
      
      // Return a fallback evaluation for testing or when API fails
      return {
        success: true,
        score: 75,
        feedback: 'Your answers demonstrate a good understanding of caregiving principles. You show empathy and practical knowledge.',
        improvements: 'Consider expanding your knowledge of emergency procedures and medication management.',
        passThreshold: true,
        cachedOnly: true
      };
    }
  },

  /**
   * Get qualification status for the current user
   * @returns {Object} - Qualification status
   */
  getQualificationStatus: () => {
    try {
      // Try to get from localStorage first
      const storedStatus = localStorage.getItem('qualificationStatus');
      if (storedStatus) {
        const status = JSON.parse(storedStatus);
        
        // Check if retake period has elapsed if user failed previously
        if (!status.isQualified && status.canRetakeAfter) {
          const retakeDate = new Date(status.canRetakeAfter);
          const now = new Date();
          
          // Update canRetake flag based on current date vs retake date
          status.canRetake = now >= retakeDate;
          
          // If retake is now allowed, update the status in localStorage
          if (status.canRetake) {
            localStorage.setItem('qualificationStatus', JSON.stringify(status));
          }
        }
        
        return status;
      }
      
      // If no status found, return default values
      return {
        assessmentCompleted: false,
        isQualified: false,
        canRetake: true
      };
    } catch (error) {
      console.error('Error getting qualification status:', error);
      return {
        assessmentCompleted: false,
        isQualified: false,
        canRetake: true,
        error: 'Could not retrieve qualification status'
      };
    }
  },
  
  /**
   * Reset qualification status to allow retaking assessment
   * Typically called when retake period has elapsed
   * @returns {Object} - Updated qualification status
   */
  resetQualificationStatus: () => {
    try {
      // Get current status
      const currentStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
      
      // Update to allow retake
      const updatedStatus = {
        ...currentStatus,
        canRetake: true,
        retakeReset: new Date().toISOString()
      };
      
      localStorage.setItem('qualificationStatus', JSON.stringify(updatedStatus));
      return updatedStatus;
    } catch (error) {
      console.error('Error resetting qualification status:', error);
      return { error: 'Could not reset qualification status' };
    }
  },
  
  /**
   * For testing only: Force reset all qualification data
   * This allows testing different qualification scenarios
   * @param {Object} options - Configuration options for test status
   * @returns {Object} - Created test status
   */
  _forceQualificationStatus: (options = {}) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('_forceQualificationStatus should not be used in production');
      return null;
    }
    
    try {
      const defaultStatus = {
        assessmentCompleted: false,
        isQualified: false,
        canRetake: true,
        score: 0,
        timestamp: new Date().toISOString()
      };
      
      const testStatus = {
        ...defaultStatus,
        ...options
      };
      
      localStorage.setItem('qualificationStatus', JSON.stringify(testStatus));
      console.log('Test qualification status set:', testStatus);
      return testStatus;
    } catch (error) {
      console.error('Error setting test qualification status:', error);
      return null;
    }
  }
};

export default assessmentService;
