/**
 * Test script to verify question bank generation and storage in MongoDB
 * 
 * This script:
 * 1. Generates a small batch of questions using the OpenAI service
 * 2. Sends them to the .NET backend for storage
 * 3. Retrieves the stored questions to verify they were saved correctly
 */
const axios = require('axios');
const dotenv = require('dotenv');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const openAIService = require('../services/openAIService');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

// Configuration
const API_HOST = process.env.API_HOST || 'http://localhost:5000'; // .NET Backend URL
const NODE_API_HOST = process.env.NODE_API_HOST || 'http://localhost:3000'; // Node API URL
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || process.env.ADMIN_TOKEN;

// Test categories and user types
const TEST_CASES = [
  { userType: "Cleaner", category: "Respecting Client Privacy and Dignity", count: 2 },
  { userType: "Caregiver", category: "Basic Caregiving Skills", count: 2 }
];

// Delay utility to avoid overwhelming APIs
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validates a question object structure
 */
function validateQuestion(question) {
  return (
    question.id &&
    question.category &&
    question.userType &&
    question.question &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.correctAnswer &&
    ["A", "B", "C", "D"].includes(question.correctAnswer)
  );
}

/**
 * Generates questions using OpenAI
 */
async function generateQuestions(userType, category, count) {
  try {
    logger.info(`Generating ${count} questions for ${userType} - ${category}...`);
    const questions = await openAIService.generateMultipleChoiceQuestions(userType, category, count);
    
    // Validate the questions
    const validQuestions = questions.filter(validateQuestion);
    logger.info(`Generated ${validQuestions.length}/${count} valid questions for ${userType} - ${category}`);
    
    return validQuestions;
  } catch (error) {
    logger.error(`Error generating questions: ${error.message}`);
    return [];
  }
}

/**
 * Sends questions to the .NET backend for storage
 */
async function storeQuestions(questions) {
  try {
    logger.info(`Storing ${questions.length} questions in the database...`);
    const response = await axios.post(`${API_HOST}/api/QuestionBank/batch`, 
      { questions },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    logger.info(`Successfully stored questions. Response: ${response.status}`);
    return response.data;
  } catch (error) {
    logger.error(`Error storing questions: ${error.message}`);
    if (error.response) {
      logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

/**
 * Retrieves questions from the .NET backend to verify storage
 */
async function retrieveQuestions(userType, category) {
  try {
    logger.info(`Retrieving questions for ${userType} - ${category}...`);
    const response = await axios.get(
      `${API_HOST}/api/QuestionBank/search?userType=${userType}&category=${encodeURIComponent(category)}`,
      { 
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    logger.info(`Retrieved ${response.data.length} questions for ${userType} - ${category}`);
    return response.data;
  } catch (error) {
    logger.error(`Error retrieving questions: ${error.message}`);
    if (error.response) {
      logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

/**
 * Main test function
 */
async function runTest() {
  logger.info('Starting question bank storage test...');
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const { userType, category, count } = testCase;
    
    // Step 1: Generate questions
    const questions = await generateQuestions(userType, category, count);
    if (questions.length === 0) {
      results.push({
        userType,
        category,
        success: false,
        message: 'Failed to generate questions'
      });
      continue;
    }
    
    // Step 2: Store questions in the database
    const storedResult = await storeQuestions(questions);
    if (!storedResult) {
      results.push({
        userType,
        category,
        success: false,
        message: 'Failed to store questions'
      });
      continue;
    }
    
    // Add a delay to ensure questions are stored before retrieving
    await delay(2000);
    
    // Step 3: Retrieve the questions to verify storage
    const retrievedQuestions = await retrieveQuestions(userType, category);
    
    // Check if we retrieved at least as many questions as we stored
    const success = retrievedQuestions.length >= questions.length;
    
    results.push({
      userType,
      category,
      success,
      generated: questions.length,
      retrieved: retrievedQuestions.length,
      message: success 
        ? `Successfully stored and retrieved questions` 
        : `Failed to verify question storage`
    });
    
    // Add a delay before the next test case
    await delay(1000);
  }
  
  // Display test results
  logger.info('\nTest Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    logger.info(`${status} ${result.userType} - ${result.category}: ${result.message}`);
    if (result.generated !== undefined) {
      logger.info(`   Generated: ${result.generated}, Retrieved: ${result.retrieved}`);
    }
  });
  
  const allSuccess = results.every(r => r.success);
  logger.info(`\nOverall Test Result: ${allSuccess ? '✅ PASSED' : '❌ FAILED'}`);
}

// Run the test
runTest().catch(err => {
  logger.error(`Unhandled error in test: ${err.message}`);
  process.exit(1);
});
