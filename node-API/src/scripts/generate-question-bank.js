/**
 * Script to generate and seed the complete question bank for the assessment system
 * 
 * This script:
 * 1. Defines question categories for Cleaners and Caregivers
 * 2. Generates sample questions for each category
 * 3. Sends them to the backend API for storage
 * 4. Verifies the questions were stored successfully
 */
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Configuration
const API_HOST = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || process.env.ADMIN_TOKEN || process.env.INTERNAL_API_KEY;
const BATCH_SIZE = 5; // Number of questions to send in each batch

// Define question categories
const QUESTION_CATEGORIES = {
  Cleaner: [
    "Respecting Client Privacy and Dignity",
    "Showing Respect and Professionalism in the Home",
    "Basic Emergency Awareness and Response",
    "Understanding Client Rights and Confidentiality"
  ],
  Caregiver: [
    "Basic Caregiving Skills",
    "Emergency Response, CPR, and First Aid",
    "Accurate and Timely Reporting Skills",
    "Understanding of Medication Support and Observation"
  ]
};

// Predefined question templates for each category
const questionTemplates = {
  "Respecting Client Privacy and Dignity": [
    {
      question: "What is the best way to protect a client's personal information?",
      options: [
        "Share it only with immediate family members",
        "Keep it secure and only share on a need-to-know basis with authorized personnel",
        "Store it on your personal device for easy access",
        "Discuss it with other healthcare professionals in public areas"
      ],
      correctAnswer: "B",
      explanation: "Client information should only be shared with authorized personnel who need it for care purposes, and must be kept secure at all times."
    },
    {
      question: "When assisting a client with personal care, what should you always do?",
      options: [
        "Complete the task quickly to avoid embarrassment",
        "Leave the door open in case you need assistance",
        "Provide privacy and explain what you're doing",
        "Ask family members to help with intimate care tasks"
      ],
      correctAnswer: "C",
      explanation: "Providing privacy and explaining procedures helps maintain dignity and builds trust with clients."
    },
    {
      question: "Which of the following is a breach of client privacy?",
      options: [
        "Documenting care in the client's secure record",
        "Discussing the client's condition with their doctor",
        "Posting about your workday with the client on social media",
        "Keeping client information in a locked cabinet"
      ],
      correctAnswer: "C",
      explanation: "Posting about clients on social media, even without names, is a breach of privacy and confidentiality."
    }
  ],
  "Showing Respect and Professionalism in the Home": [
    {
      question: "What is the most professional approach when entering a client's home?",
      options: [
        "Rearrange items to make your work easier",
        "Knock, identify yourself, and wait for permission to enter",
        "Enter quietly to avoid disturbing the client",
        "Call out loudly so the client knows you've arrived"
      ],
      correctAnswer: "B",
      explanation: "Knocking, identifying yourself, and waiting for permission shows respect for the client's home and privacy."
    },
    {
      question: "When a client has cultural or religious practices different from yours, you should:",
      options: [
        "Ignore them as they don't affect your care duties",
        "Try to convince them to change their practices for better care",
        "Respect and accommodate their practices when providing care",
        "Only follow practices you personally agree with"
      ],
      correctAnswer: "C",
      explanation: "Respecting and accommodating a client's cultural and religious practices is essential for person-centered care."
    }
  ],
  "Basic Emergency Awareness and Response": [
    {
      question: "If you discover a small fire in a client's home, what should you do first?",
      options: [
        "Call the client's family",
        "Try to put it out yourself",
        "Get the client to safety and call emergency services",
        "Open windows to let smoke escape"
      ],
      correctAnswer: "C",
      explanation: "The safety of the client is the primary concern. Get them to safety first, then call emergency services."
    },
    {
      question: "What information should you have ready when calling emergency services?",
      options: [
        "Your personal information and work schedule",
        "The client's address, nature of emergency, and client condition",
        "The client's medication list only",
        "The client's family contact information"
      ],
      correctAnswer: "B",
      explanation: "Emergency services need to know the location, nature of emergency, and client's condition to respond appropriately."
    }
  ],
  "Understanding Client Rights and Confidentiality": [
    {
      question: "A client's right to confidentiality means:",
      options: [
        "You can discuss their care with anyone who asks",
        "You can share their information with your friends if you don't use their name",
        "Their personal information should only be shared with authorized personnel for care purposes",
        "You should only discuss their care with family members"
      ],
      correctAnswer: "C",
      explanation: "Confidentiality means personal information is only shared with authorized persons who need it for care purposes."
    },
    {
      question: "If a client refuses a recommended care procedure, you should:",
      options: [
        "Perform it anyway because it's for their own good",
        "Respect their decision after ensuring they understand the implications",
        "Call their family to override their decision",
        "Threaten to withdraw services"
      ],
      correctAnswer: "B",
      explanation: "Clients have the right to refuse care. Ensure they understand the implications, but respect their informed decision."
    }
  ],
  "Basic Caregiving Skills": [
    {
      question: "When helping a client transfer from bed to wheelchair, you should:",
      options: [
        "Pull them by their arms to save time",
        "Use proper body mechanics and assistive devices as needed",
        "Have them stand up quickly and pivot",
        "Lift them yourself to demonstrate your strength"
      ],
      correctAnswer: "B",
      explanation: "Proper body mechanics and assistive devices protect both the caregiver and client from injury during transfers."
    },
    {
      question: "When assisting with bathing, which is the correct approach?",
      options: [
        "Always use cold water to prevent burns",
        "Insist on a full bath or shower every day",
        "Provide privacy, warmth, and allow the client to do as much as they can independently",
        "Complete the bath as quickly as possible"
      ],
      correctAnswer: "C",
      explanation: "Providing privacy, warmth, and promoting independence shows respect and maintains dignity during bathing."
    }
  ],
  "Emergency Response, CPR, and First Aid": [
    {
      question: "If a client is unresponsive and not breathing normally, you should first:",
      options: [
        "Place them in the recovery position",
        "Give them water",
        "Call emergency services and begin CPR",
        "Wait to see if they recover on their own"
      ],
      correctAnswer: "C",
      explanation: "For an unresponsive client who isn't breathing normally, calling emergency services and beginning CPR immediately is critical."
    },
    {
      question: "For a client who is choking but can still speak and cough, you should:",
      options: [
        "Immediately perform abdominal thrusts",
        "Encourage them to keep coughing",
        "Slap them on the back five times",
        "Have them drink water"
      ],
      correctAnswer: "B",
      explanation: "If someone is coughing effectively, encourage them to keep coughing to clear the obstruction themselves."
    }
  ],
  "Accurate and Timely Reporting Skills": [
    {
      question: "When should you document changes in a client's condition?",
      options: [
        "At the end of the week",
        "Only if the changes are serious",
        "As soon as possible after observing the changes",
        "Only when requested by a supervisor"
      ],
      correctAnswer: "C",
      explanation: "Prompt documentation ensures accurate information is available for all care providers and helps track changes over time."
    },
    {
      question: "What information is important to include when documenting client care?",
      options: [
        "Only physical symptoms",
        "Your opinion about the client's family",
        "Objective observations, actions taken, and client responses",
        "Just the medications administered"
      ],
      correctAnswer: "C",
      explanation: "Documentation should include objective observations, care provided, and how the client responded to provide a complete picture."
    }
  ],
  "Understanding of Medication Support and Observation": [
    {
      question: "As a caregiver, your role in medication support typically includes:",
      options: [
        "Prescribing medications",
        "Changing medication dosages based on your assessment",
        "Reminding and observing clients taking their prescribed medications",
        "Administering injections"
      ],
      correctAnswer: "C",
      explanation: "Caregivers typically remind clients to take medications, observe for side effects, and report issues, but don't prescribe or adjust medications."
    },
    {
      question: "If you notice a client experiencing possible medication side effects, you should:",
      options: [
        "Stop the medication immediately",
        "Adjust the dosage yourself",
        "Document your observations and report them promptly to the appropriate healthcare provider",
        "Wait to see if the side effects go away on their own"
      ],
      correctAnswer: "C",
      explanation: "Documenting and reporting potential side effects promptly is essential for client safety, but caregivers should not adjust medications themselves."
    }
  ]
};

// Track execution time
const startTime = Date.now();

/**
 * Logs info messages to the console
 */
function log(message) {
  console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
}

/**
 * Logs error messages to the console
 */
function logError(message) {
  console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
}

/**
 * Generates a UUID for tracking questions
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Creates variations of a question to expand the question bank
 */
function createQuestionVariations(baseQuestion, count) {
  const variations = [baseQuestion];
  
  // Simple variations by slightly modifying the question text
  const prefixes = [
    "In your role as a caregiver, ",
    "According to best practices, ",
    "When working with clients, ",
    "Based on professional standards, ",
    "As part of providing quality care, "
  ];
  
  const suffixes = [
    " in a home care setting?",
    " when caring for elderly clients?",
    " in your daily practice?",
    " according to care standards?",
    " when supporting clients with daily activities?"
  ];
  
  // Generate variations until we reach the desired count
  while (variations.length < count) {
    const baseIndex = Math.floor(Math.random() * variations.length);
    const template = {...variations[baseIndex]};
    
    // Add a random prefix or suffix to create a variation
    const usePrefix = Math.random() > 0.5;
    let newQuestion = template.question;
    
    if (usePrefix) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      newQuestion = prefix + newQuestion.charAt(0).toLowerCase() + newQuestion.slice(1);
    } else {
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      // Remove question mark if present to avoid double question marks
      newQuestion = newQuestion.replace(/\?$/, '') + suffix;
    }
    
    // Create a new question with the variation
    const variation = {
      ...template,
      question: newQuestion,
      id: generateId() // Ensure unique ID
    };
    
    variations.push(variation);
  }
  
  return variations.slice(0, count);
}

/**
 * Generates questions for a specific category and user type
 */
async function generateQuestions(userType, category, count) {
  try {
    log(`Generating ${count} questions for ${userType} - ${category}`);
    
    // Get the template questions for this category
    const templates = questionTemplates[category] || [];
    
    if (templates.length === 0) {
      logError(`No template questions found for category: ${category}`);
      return [];
    }
    
    // Generate variations to reach desired count
    const questionVariations = [];
    
    // Calculate how many variations we need of each template
    const variationsPerTemplate = Math.ceil(count / templates.length);
    
    // Create variations for each template
    for (const template of templates) {
      const variations = createQuestionVariations(template, variationsPerTemplate);
      questionVariations.push(...variations);
    }
    
    // Format questions with proper fields
    const formattedQuestions = questionVariations.slice(0, count).map(q => ({
      id: q.id || generateId(),
      category,
      userType,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    return formattedQuestions;
  } catch (error) {
    logError(`Error generating questions: ${error.message}`);
    return [];
  }
}

/**
 * Sends a batch of questions to the backend for storage
 */
async function storeQuestionBatch(questions) {
  try {
    log(`Storing batch of ${questions.length} questions...`);
    
    // Process each question individually
    const results = [];
    
    for (const question of questions) {
      try {
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
          id: response.data?.id || question.id,
          category: question.category,
          userType: question.userType
        });
      } catch (err) {
        results.push({
          success: false,
          category: question.category,
          userType: question.userType,
          error: err.message,
          response: err.response?.data
        });
        
        logError(`Failed to store question in category ${question.category}: ${err.message}`);
        if (err.response?.data) {
          logError(`Response: ${JSON.stringify(err.response.data)}`);
        }
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  } catch (error) {
    logError(`Error in batch processing: ${error.message}`);
    return [];
  }
}

/**
 * Main function to generate and store the complete question bank
 */
async function generateQuestionBank() {
  log('Starting question bank generation...');
  log(`API Host: ${API_HOST}`);
  
  const summary = {
    totalQuestions: 0,
    successfullyStored: 0,
    categories: {},
    errors: 0
  };
  
  // Define target counts for each category
  const questionCounts = {
    "Respecting Client Privacy and Dignity": 15,
    "Showing Respect and Professionalism in the Home": 15,
    "Basic Emergency Awareness and Response": 10,
    "Understanding Client Rights and Confidentiality": 10,
    "Basic Caregiving Skills": 40,
    "Emergency Response, CPR, and First Aid": 30,
    "Accurate and Timely Reporting Skills": 20,
    "Understanding of Medication Support and Observation": 10
  };
  
  // Process each user type
  for (const userType in QUESTION_CATEGORIES) {
    const categories = QUESTION_CATEGORIES[userType];
    
    for (const category of categories) {
      const targetCount = questionCounts[category] || 10;
      summary.totalQuestions += targetCount;
      
      // Initialize category in summary
      if (!summary.categories[category]) {
        summary.categories[category] = {
          total: targetCount,
          generated: 0,
          stored: 0
        };
      }
      
      // Generate questions for this category
      const questions = await generateQuestions(userType, category, targetCount);
      summary.categories[category].generated += questions.length;
      
      log(`Generated ${questions.length}/${targetCount} questions for ${userType} - ${category}`);
      
      // Process in batches
      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const results = await storeQuestionBatch(batch);
        
        const successCount = results.filter(r => r.success).length;
        summary.successfullyStored += successCount;
        summary.categories[category].stored += successCount;
        summary.errors += (results.length - successCount);
        
        log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: Stored ${successCount}/${batch.length} questions successfully`);
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Display final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('\nQuestion Bank Generation Summary:');
  log(`Total questions targeted: ${summary.totalQuestions}`);
  log(`Successfully stored: ${summary.successfullyStored}`);
  log(`Errors: ${summary.errors}`);
  log(`Time taken: ${duration} seconds`);
  log('\nCategory Breakdown:');
  
  for (const category in summary.categories) {
    const stats = summary.categories[category];
    log(`${category}: ${stats.stored}/${stats.total} stored (${stats.generated} generated)`);
  }
  
  return summary;
}

// Run the question bank generation
generateQuestionBank().catch(err => {
  logError(`Unhandled error: ${err.message}`);
  process.exit(1);
});
