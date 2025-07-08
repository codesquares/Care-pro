/**
 * Test Assessment Scoring System
 * 
 * This script tests the assessment scoring functionality by:
 * 1. Retrieving questions for assessment (Cleaner or Caregiver)
 * 2. Submitting mock answers to those questions
 * 3. Verifying the score calculation and pass/fail status
 * 
 * Command: node src/scripts/test-assessment-scoring.js [userType] [passRate]
 * - userType: 'Cleaner' or 'Caregiver' (default: 'Caregiver')
 * - passRate: Percentage of questions to answer correctly (default: 80 - should pass)
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

// Create a namespaced logger
const testLogger = logger.createLogger('assessment-scoring');

// Configuration
const API_URL = process.env.API_URL;
if (!API_URL) {
  testLogger.error('API_URL not defined in .env file');
  process.exit(1);
}

// Command line arguments
const userType = process.argv[2] || 'Caregiver';
const passRateArg = process.argv[3] ? parseInt(process.argv[3]) : 80; // Default to 80% correct (should pass)

// Validate user type
if (!['Cleaner', 'Caregiver'].includes(userType)) {
  testLogger.error(`Invalid user type: ${userType}. Must be 'Cleaner' or 'Caregiver'`);
  process.exit(1);
}

// Validate pass rate
const passRate = Math.min(Math.max(0, passRateArg), 100); // Ensure between 0-100
testLogger.info(`Running test for ${userType} with target pass rate: ${passRate}%`);

// Mock user IDs (would be real in production)
const USER_ID = `test-user-${Date.now()}`;
const CAREGIVER_ID = `test-caregiver-${Date.now()}`;

// API endpoints
const ASSESSMENT_QUESTIONS_ENDPOINT = `${API_URL}/Assessments/questions/${userType}`;
const SUBMIT_ASSESSMENT_ENDPOINT = `${API_URL}/Assessments`;
const GET_ASSESSMENT_ENDPOINT = `${API_URL}/Assessments/`;

/**
 * Get questions for assessment
 */
async function getQuestionsForAssessment() {
  try {
    testLogger.info(`Fetching assessment questions for ${userType}...`);
    const response = await axios.get(ASSESSMENT_QUESTIONS_ENDPOINT);
    return response.data;
  } catch (error) {
    testLogger.error(`Error fetching questions: ${error.message}`);
    if (error.response) {
      testLogger.error(`Status: ${error.response.status}`);
      testLogger.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Prepare mock answers with a target pass rate
 * @param {Array} questions Questions from the assessment
 * @param {number} targetPassRate Percentage of questions to answer correctly
 * @returns {Array} Array of assessment questions with mock user answers
 */
function prepareMockAnswers(questions, targetPassRate) {
  testLogger.info(`Preparing mock answers with ${targetPassRate}% correct responses...`);
  
  // Calculate how many questions to answer correctly
  const totalQuestions = questions.length;
  const correctAnswersNeeded = Math.round((totalQuestions * targetPassRate) / 100);
  
  // Prepare shuffled questions for random selection
  const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
  
  // Map questions to assessment question format
  return shuffledQuestions.map((question, index) => {
    // For the first N questions needed to hit our target, use correct answer
    // For the rest, use a random incorrect answer
    const useCorrectAnswer = index < correctAnswersNeeded;
    
    let userAnswer;
    if (useCorrectAnswer) {
      // Use the correct answer
      userAnswer = question.correctAnswer;
    } else {
      // Select a random incorrect answer
      const incorrectOptions = question.options.filter(opt => 
        opt.toLowerCase() !== question.correctAnswer.toLowerCase()
      );
      
      // If there are no incorrect options (shouldn't happen with proper questions), use the correct one
      userAnswer = incorrectOptions.length > 0 
        ? incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)]
        : question.correctAnswer;
    }
    
    // Return complete question object with user's answer
    return {
      questionId: question.id,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      userAnswer: userAnswer,
      isCorrect: useCorrectAnswer // We know this in advance since we're controlling the answers
    };
  });
}

/**
 * Submit assessment with mock answers
 * @param {Array} questions Questions with mock answers
 */
async function submitAssessment(answeredQuestions) {
  try {
    testLogger.info(`Submitting assessment with ${answeredQuestions.length} questions...`);
    
    const assessmentRequest = {
      userId: USER_ID,
      caregiverId: CAREGIVER_ID,
      userType: userType,
      questions: answeredQuestions,
      status: 'Completed',
      score: 0 // Score will be calculated by the backend
    };
    
    const response = await axios.post(SUBMIT_ASSESSMENT_ENDPOINT, assessmentRequest);
    testLogger.info(`Assessment submitted successfully, ID: ${response.data}`);
    return response.data; // Assessment ID
  } catch (error) {
    testLogger.error(`Error submitting assessment: ${error.message}`);
    if (error.response) {
      testLogger.error(`Status: ${error.response.status}`);
      testLogger.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Get assessment results
 * @param {string} assessmentId The ID of the submitted assessment
 */
async function getAssessmentResults(assessmentId) {
  try {
    testLogger.info(`Fetching assessment results for ID: ${assessmentId}...`);
    const response = await axios.get(`${GET_ASSESSMENT_ENDPOINT}${assessmentId}`);
    return response.data;
  } catch (error) {
    testLogger.error(`Error fetching assessment results: ${error.message}`);
    if (error.response) {
      testLogger.error(`Status: ${error.response.status}`);
      testLogger.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Verify assessment scoring
 * @param {Object} assessment The assessment result
 * @param {Array} submittedAnswers The answers submitted
 * @param {number} targetPassRate The target pass rate for the test
 */
function verifyAssessmentScoring(assessment, submittedAnswers, targetPassRate) {
  testLogger.info('Verifying assessment scoring...');
  
  // Calculate expected score
  const totalQuestions = assessment.questions.length;
  const correctAnswers = assessment.questions.filter(q => q.isCorrect).length;
  const expectedScore = Math.round((correctAnswers / totalQuestions) * 100);
  
  // Verify score calculation
  const actualScore = assessment.score;
  const scoreIsCorrect = expectedScore === actualScore;
  
  // Verify pass/fail status (70% threshold)
  const expectedPassed = expectedScore >= 70;
  const passStatusIsCorrect = expectedPassed === assessment.passed;
  
  // Log results
  testLogger.info(`Assessment Results:`);
  testLogger.info(`- User Type: ${assessment.userType}`);
  testLogger.info(`- Total Questions: ${totalQuestions}`);
  testLogger.info(`- Correct Answers: ${correctAnswers} (${(correctAnswers/totalQuestions*100).toFixed(1)}%)`);
  testLogger.info(`- Target Pass Rate: ${targetPassRate}%`);
  testLogger.info(`- Expected Score: ${expectedScore}%`);
  testLogger.info(`- Actual Score: ${actualScore}%`);
  testLogger.info(`- Score Calculation: ${scoreIsCorrect ? 'CORRECT' : 'INCORRECT'}`);
  testLogger.info(`- Expected Pass Status: ${expectedPassed ? 'PASS' : 'FAIL'}`);
  testLogger.info(`- Actual Pass Status: ${assessment.passed ? 'PASS' : 'FAIL'}`);
  testLogger.info(`- Pass Status: ${passStatusIsCorrect ? 'CORRECT' : 'INCORRECT'}`);
  
  return {
    scoreIsCorrect,
    passStatusIsCorrect,
    assessment,
    expectedScore,
    actualScore
  };
}

/**
 * Main execution function
 */
async function run() {
  try {
    // Step 1: Get questions for assessment
    const questions = await getQuestionsForAssessment();
    testLogger.info(`Retrieved ${questions.length} questions for ${userType}`);
    
    // Step 2: Prepare mock answers
    const answeredQuestions = prepareMockAnswers(questions, passRate);
    
    // Step 3: Submit assessment with mock answers
    const assessmentId = await submitAssessment(answeredQuestions);
    
    // Step 4: Get assessment results
    const assessment = await getAssessmentResults(assessmentId);
    
    // Step 5: Verify scoring
    const results = verifyAssessmentScoring(assessment, answeredQuestions, passRate);
    
    // Summary
    if (results.scoreIsCorrect && results.passStatusIsCorrect) {
      testLogger.info('✅ Assessment scoring system is working correctly!');
    } else {
      testLogger.error('❌ Assessment scoring system has issues:');
      if (!results.scoreIsCorrect) {
        testLogger.error(`   - Score calculation is incorrect (Expected: ${results.expectedScore}%, Got: ${results.actualScore}%)`);
      }
      if (!results.passStatusIsCorrect) {
        testLogger.error(`   - Pass/fail status is incorrect (Expected: ${results.expectedPassed ? 'PASS' : 'FAIL'}, Got: ${results.assessment.passed ? 'PASS' : 'FAIL'})`);
      }
    }
    
    // Save results for reference
    const resultsPath = path.join(__dirname, '../../logs', `assessment-scoring-test-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify({
      userType,
      targetPassRate: passRate,
      assessment: results.assessment,
      verification: {
        scoreIsCorrect: results.scoreIsCorrect,
        passStatusIsCorrect: results.passStatusIsCorrect,
        expectedScore: results.expectedScore,
        actualScore: results.actualScore,
      }
    }, null, 2));
    testLogger.info(`Test results saved to ${resultsPath}`);

  } catch (error) {
    testLogger.error(`Test failed: ${error.message}`);
  }
}

// Run the test
run();
