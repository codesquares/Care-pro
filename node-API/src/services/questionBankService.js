// Question bank generation service using OpenAI
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate multiple choice questions based on the assessment prompt
 * @param {string} category - Category of questions to generate
 * @param {string} userType - "Cleaner" or "Caregiver"
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Array>} - Array of generated questions with options and answers
 */
const generateQuestions = async (category, userType, count = 10) => {
  try {
    console.log(`Generating ${count} questions for ${userType} in category: ${category}`);
    
    // Read the assessment prompt template
    const promptTemplatePath = path.join(__dirname, '../../Assesment_prompt.md');
    const promptTemplate = await fs.readFile(promptTemplatePath, 'utf8');
    
    // Create category-specific prompt
    const prompt = `
${promptTemplate}

I need to create ${count} multiple-choice questions for the category: "${category}" that are appropriate for ${userType}s.

Each question should follow this format exactly:
1. Question: [The question text]
   A. [Option A]
   B. [Option B]
   C. [Option C]
   D. [Option D]
   Correct Answer: [Letter of correct option]
   Explanation: [Brief explanation of why this answer is correct]

Please provide exactly ${count} questions in the specified format. Focus on making questions that test practical knowledge and critical thinking related to ${category}.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in adult social care training and assessment creation." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    // Parse the response
    const content = response.choices[0].message.content.trim();
    const questions = parseQuestionsFromText(content);
    
    // Format questions for storage
    return questions.map(q => ({
      category,
      userType,
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

/**
 * Parse questions from the AI response text
 * @param {string} text - AI response text containing questions
 * @returns {Array} - Parsed questions array
 */
const parseQuestionsFromText = (text) => {
  const questions = [];
  const questionRegex = /(\d+)\.\s+Question:\s+(.*?)(?:\n|$)([\s\S]*?)(Correct Answer:\s+)([A-D])(?:\n|$)(Explanation:\s+)([\s\S]*?)(?=\n\d+\.|$)/g;
  
  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    const questionText = match[2].trim();
    const optionsText = match[3].trim();
    const correctAnswer = match[5].trim();
    const explanation = match[7].trim();
    
    // Parse options
    const optionRegex = /([A-D])\.\s+(.*?)(?=\n[A-D]\.|$)/gs;
    let optionMatch;
    const options = {};
    
    while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
      const optionLetter = optionMatch[1];
      const optionText = optionMatch[2].trim();
      options[`option${optionLetter}`] = optionText;
    }
    
    questions.push({
      question: questionText,
      optionA: options.optionA,
      optionB: options.optionB,
      optionC: options.optionC,
      optionD: options.optionD,
      correctAnswer,
      explanation
    });
  }
  
  return questions;
};

/**
 * Save generated questions to a temporary JSON file
 * @param {Array} questions - Generated questions
 * @param {string} category - Question category
 * @param {string} userType - User type
 */
const saveQuestionsToFile = async (questions, category, userType) => {
  try {
    const fileName = `questions_${userType}_${category.replace(/\s+/g, '_')}_${Date.now()}.json`;
    const outputPath = path.join(__dirname, '../../../temp', fileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    await fs.writeFile(outputPath, JSON.stringify(questions, null, 2));
    console.log(`Questions saved to ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error saving questions to file:', error);
    throw error;
  }
};

/**
 * Send generated questions to the backend API
 * @param {Array} questions - Generated questions
 * @returns {Promise} - API response
 */
const sendQuestionsToBackend = async (questions) => {
  try {
    if (!process.env.BACKEND_API_URL) {
      throw new Error('BACKEND_API_URL not configured');
    }
    
    console.log(`Sending ${questions.length} questions to backend API...`);
    
    const apiKey = process.env.BACKEND_API_KEY;
    const response = await axios.post(
      `${process.env.BACKEND_API_URL}/api/QuestionBank/batch`,
      { questions },
      {
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('Questions successfully sent to backend');
    return response.data;
  } catch (error) {
    console.error('Error sending questions to backend:', error.message);
    throw error;
  }
};

/**
 * Generate the full question bank for all categories
 * @returns {Promise} - Result of the generation process
 */
const generateQuestionBank = async () => {
  try {
    // Define categories for each user type
    const categories = {
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
    
    // Generate questions for cleaners (50 questions total, ~12-13 per category)
    const cleanerQuestions = [];
    for (const category of categories.cleaner) {
      const questions = await generateQuestions(category, 'Cleaner', 13);
      cleanerQuestions.push(...questions);
      
      // Save interim results
      await saveQuestionsToFile(questions, category, 'Cleaner');
    }
    
    // Generate questions for caregivers (150 questions total, ~37-38 per category)
    const caregiverQuestions = [];
    for (const category of categories.caregiver) {
      const questions = await generateQuestions(category, 'Caregiver', 38);
      caregiverQuestions.push(...questions);
      
      // Save interim results
      await saveQuestionsToFile(questions, category, 'Caregiver');
    }
    
    // Save all questions
    const allQuestions = [...cleanerQuestions, ...caregiverQuestions];
    const allQuestionsPath = await saveQuestionsToFile(allQuestions, 'all', 'all');
    
    // Send to backend if environment is configured
    if (process.env.BACKEND_API_URL && process.env.BACKEND_API_KEY) {
      await sendQuestionsToBackend(allQuestions);
    } else {
      console.log('Backend API URL or key not configured. Questions saved locally only.');
    }
    
    return {
      success: true,
      questionCount: allQuestions.length,
      filePath: allQuestionsPath
    };
  } catch (error) {
    console.error('Error generating question bank:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateQuestions,
  generateQuestionBank,
  saveQuestionsToFile,
  sendQuestionsToBackend
};
