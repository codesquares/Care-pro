/**
 * Test script to verify question storage and retrieval in the assessment system
 * Uses mockup questions instead of generating them with OpenAI
 */
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Configuration
const API_HOST = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api'; // .NET Backend URL
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || process.env.ADMIN_TOKEN || process.env.INTERNAL_API_KEY;

// Sample test questions for each category and user type
const TEST_QUESTIONS = [
  // Cleaner questions
  {
    id: `test-cleaner-${Date.now()}`, // Use timestamp to make it unique
    category: "Respecting Client Privacy and Dignity",
    userType: "Cleaner",
    question: "Which of the following is a breach of client privacy?",
    options: [
      "Speaking to other care staff about a client's needs",
      "Sharing a client's personal information on social media",
      "Documenting care provided in the client's record",
      "Discussing care options with the client's family with permission"
    ],
    correctAnswer: "B",
    explanation: "Sharing client information on social media is a serious breach of confidentiality and privacy."
  },
  
  // Caregiver questions
  {
    id: `test-caregiver-${Date.now()}`, // Use timestamp to make it unique
    category: "Basic Caregiving Skills",
    userType: "Caregiver",
    question: "What is the best approach when helping a client with personal hygiene?",
    options: [
      "Complete tasks quickly to minimize discomfort",
      "Take over completely to ensure thoroughness",
      "Maintain dignity by offering choices and respecting preferences",
      "Always have a family member present for assistance"
    ],
    correctAnswer: "C",
    explanation: "Maintaining dignity by offering choices and respecting preferences preserves the client's autonomy and ensures their comfort while receiving care."
  }
];

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
 * Sends questions to the .NET backend for storage
 */
async function storeQuestions(questions) {
  try {
    log(`Storing ${questions.length} questions in the database...`);
    
    // First, create an array to store results
    const results = [];
    
    // Process each question individually to isolate errors
    for (const question of questions) {
      try {
        log(`Sending question to: ${API_HOST}/QuestionBank`);
        const response = await axios.post(`${API_HOST}/QuestionBank`, 
          question,
          { 
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AUTH_TOKEN}`
            }
          }
        );
        
        results.push({
          success: true,
          question: question.question,
          id: response.data?.id || question.id,
          status: response.status
        });
        
        log(`Successfully stored question: "${question.question.substring(0, 30)}..."`);
      } catch (err) {
        results.push({
          success: false,
          question: question.question,
          error: err.message,
          response: err.response?.data
        });
        
        logError(`Failed to store question: "${question.question.substring(0, 30)}..."`);
        logError(`Error: ${err.message}`);
        if (err.response?.data) {
          logError(`Response: ${JSON.stringify(err.response.data)}`);
        }
      }
    }
    
    return results;
  } catch (error) {
    logError(`General error storing questions: ${error.message}`);
    return [];
  }
}

/**
 * Retrieves questions from the .NET backend to verify storage
 */
async function retrieveQuestions(userType, category) {
  try {
    log(`Retrieving questions for ${userType} - ${category}...`);
    
    // Instead of searching by category and userType, get all questions and filter client-side
    const url = `${API_HOST}/QuestionBank`;
    log(`Sending request to: ${url}`);
    
    const response = await axios.get(
      url,
      { 
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    // Filter the questions client-side
    const filteredQuestions = response.data.filter(q => 
      q.userType === userType && 
      q.category === category
    );
    
    log(`Retrieved ${filteredQuestions.length} questions for ${userType} - ${category} from a total of ${response.data.length} questions`);
    return filteredQuestions;
  } catch (error) {
    logError(`Error retrieving questions: ${error.message}`);
    if (error.response?.data) {
      logError(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Main test function
 */
async function runTest() {
  log('Starting question bank storage test...');
  
  // Step 1: Store the test questions
  const storeResults = await storeQuestions(TEST_QUESTIONS);
  
  // Step 2: Check if all questions were stored successfully
  const allStored = storeResults.every(result => result.success);
  
  if (!allStored) {
    logError('Not all questions were stored successfully. Please check errors above.');
  } else {
    log('All questions stored successfully!');
  }
  
  // Step 3: Try to retrieve the questions for each user type
  const retrieveResults = [];
  const userTypes = Array.from(new Set(TEST_QUESTIONS.map(q => q.userType)));
  
  for (const userType of userTypes) {
    const categories = Array.from(new Set(
      TEST_QUESTIONS
        .filter(q => q.userType === userType)
        .map(q => q.category)
    ));
    
    for (const category of categories) {
      const questions = await retrieveQuestions(userType, category);
      
      // For simplicity, we're just checking if any questions were retrieved
      // In a real test, we'd need to verify the specific questions we added
      retrieveResults.push({
        userType,
        category,
        retrieved: questions.length,
        success: questions.length > 0
      });
    }
  }
  
  // Step 4: Display retrieval results
  log('\nRetrieval Results:');
  for (const result of retrieveResults) {
    const status = result.success ? '✅' : '❌';
    log(`${status} ${result.userType} - ${result.category}: Retrieved ${result.retrieved} questions`);
  }
  
  const allRetrieved = retrieveResults.every(r => r.success);
  log(`\nOverall Test Result: ${allRetrieved && allStored ? '✅ PASSED' : '❌ FAILED'}`);
}

// Run the test
runTest().catch(err => {
  logError(`Unhandled error in test: ${err.message}`);
  process.exit(1);
});
