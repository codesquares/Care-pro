// Assessment service for handling caregiver assessment data
import api from './api';

// Production API base URL (from config)
const PROD_API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api';

// Cache to temporarily store assessment data until backend endpoint is available
const assessmentCache = [];

// Add a logging function for monitoring assessment submissions in testing
const logAssessment = (assessmentData) => {
  console.log('Assessment submitted:', JSON.stringify(assessmentData, null, 2));
  
  // Save to file system if running on Node.js (not in browser)
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = require('fs');
    try {
      const logFile = 'assessment-submissions.log';
      const logEntry = `\n--- ${new Date().toISOString()} ---\n${JSON.stringify(assessmentData, null, 2)}\n`;
      
      fs.appendFileSync(logFile, logEntry);
      console.log(`Assessment logged to ${logFile}`);
    } catch (err) {
      console.error('Failed to log assessment to file:', err);
    }
  }
};

const assessmentService = {
  /**
   * Submit a caregiver's assessment to the API
   * @param {Object} assessmentData - The assessment data including questions and answers
   * @returns {Promise<Object>} - Response from the API
   */
  submitAssessment: async (assessmentData) => {
    try {
      // Log the assessment submission for testing
      logAssessment(assessmentData);
      
      // For testing purposes, we'll skip the actual API call and use the cache mechanism
      // This is a temporary solution until the assessment API endpoint is implemented
      console.log('Local testing mode: Storing assessment data in local cache');
      
      // Store the assessment in local cache (localStorage)
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
        existingAssessments.push({
          ...assessmentData,
          id: assessmentKey,
          cachedAt: new Date().toISOString()
        });
        localStorage.setItem('cachedAssessments', JSON.stringify(existingAssessments));
        console.log('Assessment saved to localStorage');
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
      }
      
      // Return a success response
      return {
        success: true,
        message: 'Assessment submitted successfully for testing',
        data: {
          assessmentId: assessmentKey,
          timestamp: new Date().toISOString(),
        },
        cachedOnly: true
      };
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
  }
};

export default assessmentService;
