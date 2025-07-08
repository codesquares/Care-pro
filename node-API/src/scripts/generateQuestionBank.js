/**
 * Question Bank Generation Script
 * 
 * This script generates the complete question bank as specified in the Assessment_prompt.md file.
 * It will create 200 multiple-choice questions:
 * - 50 for Cleaners/Home Managers across 4 categories
 * - 150 for Caregivers across 8 categories (including the cleaner categories)
 * 
 * The questions are generated in batches and sent to the backend for storage.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuration
const API_URL = process.env.API_HOST || 'http://localhost:3000';
const LOG_DIR = path.resolve(__dirname, '../../logs');
const AUTH_TOKEN = process.env.ADMIN_TOKEN; // Admin token for API access

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Categories as defined in the assessment prompt
const CATEGORIES = {
  cleaner: [
    'Respecting Client Privacy and Dignity',
    'Showing Respect and Professionalism in the Home',
    'Basic Emergency Awareness and Response',
    'Understanding Client Rights and Confidentiality'
  ],
  caregiver: [
    'Basic Caregiving Skills',
    'Emergency Response, CPR, and First Aid',
    'Accurate and Timely Reporting Skills',
    'Understanding of Medication Support and Observation'
  ]
};

// Question counts per category
const QUESTION_COUNTS = {
  'Respecting Client Privacy and Dignity': 15,
  'Showing Respect and Professionalism in the Home': 15,
  'Basic Emergency Awareness and Response': 10,
  'Understanding Client Rights and Confidentiality': 10,
  'Basic Caregiving Skills': 40,
  'Emergency Response, CPR, and First Aid': 30,
  'Accurate and Timely Reporting Skills': 20,
  'Understanding of Medication Support and Observation': 10
};

// Batch size for generation
const BATCH_SIZE = 10;

/**
 * Generates questions for a specific category
 * @param {string} userType - 'Cleaner', 'Caregiver', or 'Both'
 * @param {string} category - The category to generate questions for
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Object>} - API response
 */
async function generateCategoryQuestions(userType, category, count) {
  console.log(`Generating ${count} questions for ${userType} - ${category}...`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/kyc/generate-question-bank`,
      {
        userType,
        category,
        count
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error generating questions for ${category}:`, error.response?.data || error.message);
    // Log the error details
    fs.appendFileSync(
      path.join(LOG_DIR, 'question-bank-errors.log'),
      `\n[${new Date().toISOString()}] Error generating ${count} questions for ${userType} - ${category}: ${JSON.stringify(error.response?.data || error.message)}\n`
    );
    
    throw error;
  }
}

/**
 * Generates all questions for all categories in batches
 */
async function generateAllQuestions() {
  console.log('Starting question bank generation...');
  const startTime = Date.now();
  const results = {
    successful: [],
    failed: []
  };

  // First, generate cleaner questions
  for (const category of CATEGORIES.cleaner) {
    const totalCount = QUESTION_COUNTS[category];
    const batches = Math.ceil(totalCount / BATCH_SIZE);
    
    for (let i = 0; i < batches; i++) {
      const remainingCount = totalCount - (i * BATCH_SIZE);
      const batchCount = Math.min(BATCH_SIZE, remainingCount);
      
      try {
        const result = await generateCategoryQuestions('Cleaner', category, batchCount);
        results.successful.push({
          userType: 'Cleaner',
          category,
          batchCount,
          result
        });
        
        // Wait a bit between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed.push({
          userType: 'Cleaner',
          category,
          batchCount,
          error: error.message
        });
      }
    }
  }
  
  // Then generate caregiver-specific questions
  for (const category of CATEGORIES.caregiver) {
    const totalCount = QUESTION_COUNTS[category];
    const batches = Math.ceil(totalCount / BATCH_SIZE);
    
    for (let i = 0; i < batches; i++) {
      const remainingCount = totalCount - (i * BATCH_SIZE);
      const batchCount = Math.min(BATCH_SIZE, remainingCount);
      
      try {
        const result = await generateCategoryQuestions('Caregiver', category, batchCount);
        results.successful.push({
          userType: 'Caregiver',
          category,
          batchCount,
          result
        });
        
        // Wait a bit between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.failed.push({
          userType: 'Caregiver',
          category,
          batchCount,
          error: error.message
        });
      }
    }
  }
  
  // Calculate statistics
  const totalSuccessful = results.successful.reduce((sum, item) => sum + item.batchCount, 0);
  const totalFailed = results.failed.reduce((sum, item) => sum + item.batchCount, 0);
  const endTime = Date.now();
  const durationMinutes = Math.round((endTime - startTime) / 60000);
  
  // Log results
  const summary = {
    timestamp: new Date().toISOString(),
    duration: `${durationMinutes} minutes`,
    totalQuestionsGenerated: totalSuccessful,
    totalQuestionsFailed: totalFailed,
    successRate: `${Math.round((totalSuccessful / (totalSuccessful + totalFailed)) * 100)}%`
  };
  
  console.log('Question bank generation complete!');
  console.log(summary);
  
  // Save results to log file
  fs.writeFileSync(
    path.join(LOG_DIR, `question-bank-generation-${new Date().toISOString().replace(/:/g, '-')}.json`),
    JSON.stringify({ summary, results }, null, 2)
  );
}

// Run the script
generateAllQuestions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
