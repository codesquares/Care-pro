// Question bank generation controller
const questionBankService = require('../services/questionBankService');

/**
 * Generate a set of questions for a specific category
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const generateCategoryQuestions = async (req, res) => {
  try {
    const { category, userType, count } = req.body;
    
    // Validate input
    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Category is required'
      });
    }
    
    if (!userType || (userType !== 'Cleaner' && userType !== 'Caregiver')) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid user type (Cleaner or Caregiver) is required'
      });
    }
    
    const questions = await questionBankService.generateQuestions(
      category,
      userType,
      count || 10
    );
    
    // Save questions to file
    const filePath = await questionBankService.saveQuestionsToFile(questions, category, userType);
    
    res.status(200).json({
      status: 'success',
      data: {
        questions,
        filePath,
        count: questions.length
      }
    });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating questions'
    });
  }
};

/**
 * Generate the full question bank for all categories
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const generateFullQuestionBank = async (req, res) => {
  try {
    const result = await questionBankService.generateQuestionBank();
    
    if (result.success) {
      res.status(200).json({
        status: 'success',
        data: {
          questionCount: result.questionCount,
          filePath: result.filePath
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Question bank generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating the question bank'
    });
  }
};

/**
 * Send saved questions to the backend API
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const sendQuestionsToBackend = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        status: 'error',
        message: 'File path is required'
      });
    }
    
    const fs = require('fs').promises;
    const questions = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    const result = await questionBankService.sendQuestionsToBackend(questions);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error sending questions to backend:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending questions to the backend'
    });
  }
};

/**
 * Get information about question bank generation stats
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
const getQuestionStats = async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(__dirname, '../../../temp');
    const files = await fs.readdir(tempDir);
    
    const questionFiles = files.filter(file => file.startsWith('questions_') && file.endsWith('.json'));
    
    const stats = await Promise.all(questionFiles.map(async file => {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      const questions = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Parse filename to get metadata
      const nameParts = file.replace('.json', '').split('_');
      const userType = nameParts[1];
      const category = nameParts.slice(2, -1).join(' ');
      const timestamp = parseInt(nameParts[nameParts.length - 1]);
      
      return {
        filePath,
        userType,
        category,
        generatedAt: new Date(timestamp),
        questionCount: questions.length,
        fileSize: stats.size
      };
    }));
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error getting question stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting question stats'
    });
  }
};

module.exports = {
  generateCategoryQuestions,
  generateFullQuestionBank,
  sendQuestionsToBackend,
  getQuestionStats
};
