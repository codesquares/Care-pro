// Mock OpenAI before any imports that might use it
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock OpenAI response' } }]
        })
      }
    }
  }));
});

// Mock environment variables first
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  OPENAI_API_KEY: 'test-openai-key',
  BACKEND_API_URL: 'https://test-backend-api.com',
  BACKEND_API_KEY: 'test-backend-key'
};

const questionBankController = require('../../../src/controllers/questionBankController');
const questionBankService = require('../../../src/services/questionBankService');

// Mock dependencies
jest.mock('../../../src/services/questionBankService');

describe('📝 Question Bank Controller Tests - Coverage Focused', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateCategoryQuestions Coverage', () => {
    it('should generate category questions successfully', async () => {
      req.body = {
        category: 'Basic Caregiving Skills',
        userType: 'Caregiver',
        count: 5
      };

      const mockQuestions = [
        { question: 'Test question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' }
      ];
      const mockFilePath = '/temp/questions.json';

      questionBankService.generateQuestions.mockResolvedValue(mockQuestions);
      questionBankService.saveQuestionsToFile.mockResolvedValue(mockFilePath);

      await questionBankController.generateCategoryQuestions(req, res);

      expect(questionBankService.generateQuestions).toHaveBeenCalledWith(
        'Basic Caregiving Skills',
        'Caregiver',
        5
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing category parameter', async () => {
      req.body = { userType: 'Caregiver' };

      await questionBankController.generateCategoryQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Category is required'
      });
    });

    it('should handle invalid userType', async () => {
      req.body = {
        category: 'Basic Skills',
        userType: 'InvalidType'
      };

      await questionBankController.generateCategoryQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Valid user type (Cleaner or Caregiver) is required'
      });
    });

    it('should handle service errors', async () => {
      req.body = {
        category: 'Basic Skills',
        userType: 'Caregiver'
      };

      questionBankService.generateQuestions.mockRejectedValue(new Error('Service error'));

      await questionBankController.generateCategoryQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateFullQuestionBank Coverage', () => {
    it('should generate full question bank successfully', async () => {
      const mockResult = {
        success: true,
        questionCount: 200,
        filePath: '/temp/all_questions.json'
      };

      questionBankService.generateQuestionBank.mockResolvedValue(mockResult);

      await questionBankController.generateFullQuestionBank(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle service errors', async () => {
      questionBankService.generateQuestionBank.mockRejectedValue(new Error('Service error'));

      await questionBankController.generateFullQuestionBank(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof questionBankController.generateCategoryQuestions).toBe('function');
      expect(typeof questionBankController.generateFullQuestionBank).toBe('function');
    });
  });
});
