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

The qualification threshold is 50/100. If the candidate scores below this, provide specific recommendations on what they should study or practice to improve their score.`,
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

    return { evaluation, score, feedback, improvements, passThreshold: score >= 50 };
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

  if (score < 50) {
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

module.exports = { evaluateResponses, generateQuestions };
