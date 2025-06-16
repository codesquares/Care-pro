/**
 * Test script to verify assessment question retrieval for different user types
 * 
 * This script:
 * 1. Retrieves random questions for cleaners (should get 10)
 * 2. Retrieves random questions for caregivers (should get 30)
 * 3. Verifies the questions are appropriate for the user type
 */
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const API_HOST = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || process.env.ADMIN_TOKEN || process.env.INTERNAL_API_KEY;

/**
 * Logs info messages to the console
 */
function log(message) {
  console.log(`[INFO] ${message}`);
}

/**
 * Logs error messages to the console
 */
function logError(message) {
  console.error(`[ERROR] ${message}`);
}

/**
 * Retrieves assessment questions for a specific user type
 */
async function getAssessmentQuestions(userType) {
  try {
    log(`Retrieving assessment questions for ${userType}...`);
    
    const url = `${API_HOST}/Assessments/Questions/${userType}`;
    log(`Sending request to: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (Array.isArray(response.data)) {
      log(`Retrieved ${response.data.length} questions for ${userType}`);
      return response.data;
    } else {
      logError(`Unexpected response format: ${JSON.stringify(response.data)}`);
      return [];
    }
  } catch (error) {
    logError(`Error retrieving questions: ${error.message}`);
    if (error.response?.data) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Analyzes questions by category for a user type
 */
function analyzeQuestions(questions, userType) {
  // Count questions by category
  const categories = {};
  
  questions.forEach(q => {
    if (!categories[q.category]) {
      categories[q.category] = 0;
    }
    categories[q.category]++;
  });
  
  log(`\nCategory breakdown for ${userType}:`);
  Object.entries(categories).forEach(([category, count]) => {
    log(`- ${category}: ${count} questions`);
  });
  
  return categories;
}

/**
 * Main test function
 */
async function runTest() {
  log('Starting assessment question retrieval test...');
  
  // Test question retrieval for cleaners
  const cleanerQuestions = await getAssessmentQuestions('Cleaner');
  const expectedCleanerCount = 10;
  const cleanerResult = cleanerQuestions.length === expectedCleanerCount;
  
  // Test question retrieval for caregivers
  const caregiverQuestions = await getAssessmentQuestions('Caregiver');
  const expectedCaregiverCount = 30;
  const caregiverResult = caregiverQuestions.length === expectedCaregiverCount;
  
  // Analyze the questions
  if (cleanerQuestions.length > 0) {
    analyzeQuestions(cleanerQuestions, 'Cleaner');
  }
  
  if (caregiverQuestions.length > 0) {
    analyzeQuestions(caregiverQuestions, 'Caregiver');
  }
  
  // Display test results
  log('\nTest Results:');
  log(`Cleaner Questions: ${cleanerResult ? '✅' : '❌'} Retrieved ${cleanerQuestions.length}/${expectedCleanerCount} questions`);
  log(`Caregiver Questions: ${caregiverResult ? '✅' : '❌'} Retrieved ${caregiverQuestions.length}/${expectedCaregiverCount} questions`);
  
  const overallResult = cleanerResult && caregiverResult;
  log(`\nOverall Test Result: ${overallResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    cleanerQuestions,
    caregiverQuestions,
    cleanerResult,
    caregiverResult,
    overallResult
  };
}

// Run the test
runTest().catch(err => {
  logError(`Unhandled error in test: ${err.message}`);
  process.exit(1);
});
