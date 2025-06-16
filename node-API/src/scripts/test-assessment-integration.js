/**
 * Test Assessment Integration
 * 
 * This script tests the integration between the Node.js API and the C# backend for assessments.
 * It verifies that the assessment system has been properly integrated with the frontend.
 * 
 * Usage: node src/scripts/test-assessment-integration.js
 */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Configuration
const NODE_API_URL = process.env.NODE_API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN; // You need to set this in your .env

if (!JWT_TOKEN) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: TEST_JWT_TOKEN not defined in .env file');
  console.log('Please add a valid JWT token to your .env file as TEST_JWT_TOKEN');
  process.exit(1);
}

// Test user info
const TEST_USER = {
  userId: 'test-user-integration',
  userType: 'Caregiver'
};

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  console.log('\x1b[36m%s\x1b[0m', '🔍 Starting Assessment Integration Test');
  console.log('-'.repeat(50));
  
  try {
    // Step 1: Test fetching questions from the API
    console.log('\x1b[33m%s\x1b[0m', '📝 Fetching assessment questions...');
    
    const questionsResponse = await axios.get(
      `${NODE_API_URL}/api/assessment/questions/${TEST_USER.userType}`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    if (questionsResponse.data.success && Array.isArray(questionsResponse.data.data)) {
      console.log('\x1b[32m%s\x1b[0m', `✅ Successfully fetched ${questionsResponse.data.data.length} questions`);
      
      // Step 2: Submit a test assessment
      if (questionsResponse.data.data.length > 0) {
        const questions = questionsResponse.data.data;
        console.log('\x1b[33m%s\x1b[0m', '📊 Submitting test assessment...');
        
        // Prepare mock answers (all correct for testing purposes)
        const answeredQuestions = questions.map(question => ({
          id: question.id,
          text: question.text || question.question, // Handle both formats
          answer: question.correctAnswer // Use correct answers for this test
        }));
        
        // Create assessment submission
        const submission = {
          userId: TEST_USER.userId,
          userType: TEST_USER.userType,
          timestamp: new Date().toISOString(),
          questions: answeredQuestions
        };
        
        // Submit assessment
        const submitResponse = await axios.post(
          `${NODE_API_URL}/api/assessment/submit`,
          submission,
          {
            headers: {
              'Authorization': `Bearer ${JWT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Validate submission response
        if (submitResponse.data.success && submitResponse.data.data) {
          const result = submitResponse.data.data;
          console.log('\x1b[32m%s\x1b[0m', `✅ Assessment submitted successfully`);
          console.log(`   Score: ${result.score}%`);
          console.log(`   Passed: ${result.passed ? 'Yes' : 'No'}`);
          
          // Save result to file for reference
          const resultPath = path.join(__dirname, '../../logs', 'assessment-integration-test-result.json');
          fs.writeFileSync(resultPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            questions: questions.length,
            result: result
          }, null, 2));
          
          console.log('\x1b[32m%s\x1b[0m', `✅ Test results saved to ${resultPath}`);
        } else {
          console.error('\x1b[31m%s\x1b[0m', `❌ Failed to submit assessment: ${JSON.stringify(submitResponse.data)}`);
        }
      }
    } else {
      console.error('\x1b[31m%s\x1b[0m', `❌ Failed to fetch questions: ${JSON.stringify(questionsResponse.data)}`);
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Integration test failed:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log('-'.repeat(50));
  console.log('\x1b[36m%s\x1b[0m', '🏁 Assessment Integration Test Complete');
}

// Run the test
runIntegrationTest();
