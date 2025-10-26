const axios = require('axios');
require('dotenv').config();

/**
 * Generates assessment questions for healthcare providers
 * @param {string} providerType - Type of healthcare provider (caregiver, nurse, doctor, dietician, etc.)
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Array<string>>} Array of generated questions
 */
const generateQuestions = async (providerType = 'caregiver', count = 10) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a healthcare evaluation expert. Generate ${count} assessment questions to evaluate the skills, knowledge, and experience of a ${providerType}. The questions should be specific to their field and cover essential knowledge, emergency situations, ethical scenarios, and practical skills.`,
      },
      {
        role: 'user',
        content: `Please generate ${count} assessment questions for ${providerType}s. Include questions about patient care, emergency handling, ethical considerations, and field-specific knowledge.`,
      },
    ];

    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices?.[0]?.message) {
      throw new Error('Invalid OpenAI API response');
    }

    const content = result.data.choices[0].message.content;
    const questionRegex = /\d+[\.\)]\s*(.*?)(?=\d+[\.\)]|$)/gs;
    const questions = [];
    let match;

    while ((match = questionRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        questions.push(match[1].trim());
      }
    }

    if (questions.length === 0) {
      return content
        .split('\n')
        .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter((line) => line.length > 0 && /\?$/.test(line))
        .slice(0, count);
    }

    return questions.slice(0, count);
  } catch (error) {
    console.error('Error generating questions:', error.response?.data || error.message);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

/**
 * Evaluates responses from healthcare providers
 * @param {Array<string>} responses - Array of responses to be evaluated
 * @param {string} providerType - Type of healthcare provider (default: 'caregiver')
 * @returns {Promise<Object>} Evaluation results
 */
const evaluateResponses = async (responses, providerType = 'caregiver') => {
  try {
    const userResponsesText = responses.join('\n\n');

    const messages = [
      {
        role: 'system',
        content: `You are a healthcare assessment expert specializing in evaluating ${providerType}s. 
        
Your task is to:
1. Thoroughly evaluate the following responses from a ${providerType}.
2. Provide a score out of 100 based on accuracy, depth, relevance, and practical knowledge.
3. Include detailed, constructive feedback for each answer, highlighting strengths and areas for improvement.
4. Be particularly thorough about safety protocols and patient care best practices.
5. Format your response with "Score: X/100" at the beginning followed by detailed feedback.

The qualification threshold is 70/100. If the candidate scores below this, provide specific recommendations on what they should study or practice to improve their score.`,
      },
      {
        role: 'user',
        content: userResponsesText,
      },
    ];

    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices?.[0]?.message) {
      throw new Error('Invalid OpenAI API response');
    }

    const evaluation = result.data.choices[0].message.content;
    const score = extractScore(evaluation.trim());
    const { feedback, improvements } = extractFeedback(evaluation, score);

    return { evaluation, score, feedback, improvements, passThreshold: score >= 70 };
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
};

/**
 * Extracts numeric score from evaluation text
 * @param {string} evaluation - The evaluation text from OpenAI
 * @returns {number} - Score from 0-100
 */
const extractScore = (evaluation) => {
  const scoreMatch = evaluation.match(/(\d+)\/\d+/);
  if (scoreMatch) return parseInt(scoreMatch[1], 10);

  const scoreMatchFallback = evaluation.match(/Score:\s*(\d+)/);
  return scoreMatchFallback ? parseInt(scoreMatchFallback[1], 10) : 0;
};

/**
 * Extracts structured feedback and improvement suggestions from evaluation text
 * @param {string} evaluation - The evaluation text from OpenAI
 * @param {number} score - Numeric score
 * @returns {Object} - Structured feedback and improvements
 */
const extractFeedback = (evaluation, score) => {
  const content = evaluation.replace(/^Score:.*\n+/, '');
  let feedback = content;
  let improvements = '';

  if (score < 70) {
    const improvementMatch = content.match(/(?:improvements|recommendations|suggestions|to improve):([\s\S]+)$/i);
    if (improvementMatch) {
      improvements = improvementMatch[1].trim();
      feedback = content.replace(/(?:improvements|recommendations|suggestions|to improve):([\s\S]+)$/i, '').trim();
    } else {
      const paragraphs = content.split(/\n\n+/);
      if (paragraphs.length > 1) {
        improvements = paragraphs.pop().trim();
        feedback = paragraphs.join('\n\n');
      }
    }
  }

  return { feedback, improvements };
};

/**
 * Generates a batch of multiple-choice questions for the assessment system
 * @param {string} userType - Type of user ('Cleaner' or 'Caregiver')
 * @param {string} category - Category of questions to generate
 * @param {number} count - Number of questions to generate in this batch
 * @returns {Promise<Array<Object>>} Array of question objects with options and answers
 */
const generateMultipleChoiceQuestions = async (userType, category, count = 10) => {
  try {
    const prompt = `You are an expert in adult social care training and assessment. Generate ${count} diverse and well-balanced multiple-choice questions for evaluating ${userType}s in the category: "${category}".

Each question should:
- Be multiple choice with exactly 4 options (A, B, C, D)
- Have only one correct answer
- Include a brief explanation for the correct answer
- Use simple, clear language suitable for people with basic literacy skills

Format each question as a JSON object:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "A", // Just the letter (A, B, C, or D)
  "explanation": "Brief explanation of why this is correct",
  "category": "${category}",
  "userType": "${userType}"
}

Ensure questions are practical, relevant to real-world scenarios, and cover important knowledge areas for ${userType}s.`;

    const messages = [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: `Please generate ${count} multiple-choice questions for ${userType}s in the category "${category}". Format them as JSON objects as specified.`,
      },
    ];

    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices?.[0]?.message) {
      throw new Error('Invalid OpenAI API response');
    }

    const content = result.data.choices[0].message.content;
    try {
      // Extract JSON objects from the content
      const jsonPattern = /\{[\s\S]*?\}/g;
      const jsonMatches = content.match(jsonPattern) || [];
      
      const questions = jsonMatches.map(jsonStr => {
        try {
          const question = JSON.parse(jsonStr);
          // Validate question format
          if (!question.question || !Array.isArray(question.options) || 
              question.options.length !== 4 || !question.correctAnswer || 
              !question.explanation || !question.category || !question.userType) {
            throw new Error('Invalid question format');
          }
          return question;
        } catch (e) {
          console.error('Error parsing question JSON:', e);
          return null;
        }
      }).filter(q => q !== null);

      if (questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      return questions;
    } catch (error) {
      console.error('Error parsing questions:', error);
      throw new Error(`Failed to parse questions: ${error.message}`);
    }
  } catch (error) {
    console.error('Error generating multiple-choice questions:', error.response?.data || error.message);
    throw new Error(`Failed to generate multiple-choice questions: ${error.message}`);
  }
};

module.exports = { evaluateResponses, generateQuestions, generateMultipleChoiceQuestions };
