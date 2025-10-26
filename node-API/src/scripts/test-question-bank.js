/**
 * Question Bank Generation Test Script
 * 
 * This script tests the question bank generation functionality without sending to backend.
 * It's meant for testing the OpenAI integration and question formatting.
 */

const { generateMultipleChoiceQuestions } = require('../services/openAIService');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuration
const LOG_DIR = path.resolve(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Test categories
const TEST_CATEGORIES = [
  {
    userType: 'Cleaner',
    category: 'Respecting Client Privacy and Dignity',
    count: 3
  },
  {
    userType: 'Caregiver',
    category: 'Basic Caregiving Skills',
    count: 3
  }
];

/**
 * Test question generation for a specific category
 */
async function testCategoryQuestionGeneration(userType, category, count) {
  console.log(`Testing question generation for ${userType} - ${category}...`);
  
  try {
    // Generate questions using OpenAI service
    const questions = await generateMultipleChoiceQuestions(userType, category, count);
    
    // Log success
    console.log(`Successfully generated ${questions.length} questions for ${userType} - ${category}`);
    
    // Validate question format
    let validCount = 0;
    for (const question of questions) {
      const isValid = 
        question.question && 
        Array.isArray(question.options) && 
        question.options.length === 4 &&
        ['A', 'B', 'C', 'D'].includes(question.correctAnswer) &&
        question.explanation &&
        question.category === category &&
        question.userType === userType;
      
      if (isValid) {
        validCount++;
      } else {
        console.error('Invalid question format:', question);
      }
    }
    
    console.log(`Valid questions: ${validCount}/${questions.length}`);
    
    return {
      success: true,
      questions,
      validCount,
      totalCount: questions.length
    };
  } catch (error) {
    console.error(`Error testing question generation for ${category}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting question bank generation tests...');
  const results = [];
  
  for (const testCase of TEST_CATEGORIES) {
    const result = await testCategoryQuestionGeneration(
      testCase.userType, 
      testCase.category, 
      testCase.count
    );
    
    results.push({
      ...testCase,
      result
    });
    
    // Write questions to file for manual inspection
    if (result.success && result.questions) {
      fs.writeFileSync(
        path.join(LOG_DIR, `test-questions-${testCase.userType}-${testCase.category.replace(/\s+/g, '-')}.json`),
        JSON.stringify(result.questions, null, 2)
      );
    }
  }
  
  // Generate summary
  console.log('\nTest Summary:');
  for (const result of results) {
    if (result.result.success) {
      console.log(`✅ ${result.userType} - ${result.category}: ${result.result.validCount}/${result.result.totalCount} valid questions`);
    } else {
      console.log(`❌ ${result.userType} - ${result.category}: Failed - ${result.result.error}`);
    }
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
