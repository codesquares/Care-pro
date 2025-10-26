/**
 * Assessment Controller Unit Tests - Coverage Focused
 * 
 * Tests all functions in assessmentController.js with comprehensive coverage
 * including success paths, error paths, validation, and edge cases
 */

const axios = require('axios');
const assessmentController = require('../../../src/controllers/assessmentController');
const { handleError } = require('../../../src/utils/errorHandler');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }))
}));

jest.mock('../../../src/utils/errorHandler', () => ({
  handleError: jest.fn()
}));

const mockAxios = axios;
const mockHandleError = handleError;

describe('🧠 Assessment Controller Unit Tests - Coverage Focused', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: {},
      body: {},
      headers: { authorization: 'Bearer test-token' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Default axios responses
    mockAxios.get = jest.fn();
    mockAxios.post = jest.fn();
    mockHandleError.mockImplementation((res, error, message) => {
      return res.status(500).json({ success: false, message });
    });
  });

  describe('getAssessmentQuestions Function Coverage', () => {
    it('should get assessment questions for Caregiver successfully', async () => {
      req.params.userType = 'Caregiver';
      const mockQuestions = [
        {
          id: 1,
          question: 'What is first aid?',
          options: ['Option A', 'Option B'],
          correctAnswer: 'Option A',
          category: 'Safety',
          explanation: 'Test explanation'
        }
      ];

      mockAxios.get.mockResolvedValue({ data: mockQuestions });

      await assessmentController.getAssessmentQuestions(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/questions/Caregiver',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: 1,
          text: 'What is first aid?',
          type: 'radio',
          options: ['Option A', 'Option B'],
          correctAnswer: 'Option A',
          category: 'Safety',
          explanation: 'Test explanation'
        }],
        fromAPI: true
      });
    });

    it('should get assessment questions for Cleaner successfully', async () => {
      req.params.userType = 'Cleaner';
      const mockQuestions = [
        {
          id: 2,
          question: 'How to clean surfaces?',
          options: ['Option A', 'Option B'],
          correctAnswer: 'Option B',
          category: 'Cleaning',
          explanation: 'Cleaning explanation'
        }
      ];

      mockAxios.get.mockResolvedValue({ data: mockQuestions });

      await assessmentController.getAssessmentQuestions(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/questions/Cleaner',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: 2,
          text: 'How to clean surfaces?',
          type: 'radio',
          options: ['Option A', 'Option B'],
          correctAnswer: 'Option B',
          category: 'Cleaning',
          explanation: 'Cleaning explanation'
        }],
        fromAPI: true
      });
    });

    it('should handle invalid user type', async () => {
      req.params.userType = 'InvalidType';

      await assessmentController.getAssessmentQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User type must be either 'Caregiver' or 'Cleaner'"
      });
    });

    it('should handle missing user type', async () => {
      req.params.userType = '';

      await assessmentController.getAssessmentQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User type must be either 'Caregiver' or 'Cleaner'"
      });
    });

    it('should handle null user type', async () => {
      req.params.userType = null;

      await assessmentController.getAssessmentQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User type must be either 'Caregiver' or 'Cleaner'"
      });
    });

    it('should handle questions without optional fields', async () => {
      req.params.userType = 'Caregiver';
      const mockQuestions = [
        {
          id: 1,
          question: 'Basic question'
          // Missing options, correctAnswer, category, explanation
        }
      ];

      mockAxios.get.mockResolvedValue({ data: mockQuestions });

      await assessmentController.getAssessmentQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: 1,
          text: 'Basic question',
          type: 'radio',
          options: [],
          correctAnswer: undefined,
          category: '',
          explanation: ''
        }],
        fromAPI: true
      });
    });

    it('should handle axios error', async () => {
      req.params.userType = 'Caregiver';
      const mockError = new Error('Network error');
      mockAxios.get.mockRejectedValue(mockError);

      await assessmentController.getAssessmentQuestions(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, mockError, 'Error fetching assessment questions');
    });

    it('should handle missing authorization header', async () => {
      req.params.userType = 'Caregiver';
      req.headers = {};
      const mockQuestions = [{ id: 1, question: 'Test' }];

      mockAxios.get.mockResolvedValue({ data: mockQuestions });

      await assessmentController.getAssessmentQuestions(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/questions/Caregiver',
        { headers: { 'Authorization': '' } }
      );
    });
  });

  describe('submitAssessment Function Coverage', () => {
    it('should submit assessment successfully', async () => {
      req.body = {
        userId: 'user123',
        userType: 'Caregiver',
        questions: [
          { id: 1, answer: 'Option A' },
          { id: 2, answer: 'Option B' }
        ]
      };

      const mockAssessmentId = 'assessment456';
      const mockAssessment = {
        score: 85,
        passed: true,
        endTimestamp: '2023-01-01T10:00:00Z'
      };

      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.submitAssessment(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments',
        {
          userId: 'user123',
          caregiverId: 'user123',
          userType: 'Caregiver',
          questions: [
            { questionId: 1, userAnswer: 'Option A' },
            { questionId: 2, userAnswer: 'Option B' }
          ],
          status: 'Completed',
          score: 0
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/assessment456',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          score: 85,
          passed: true,
          timestamp: '2023-01-01T10:00:00Z'
        }
      });
    });

    it('should submit assessment without userType (defaults to Caregiver)', async () => {
      req.body = {
        userId: 'user123',
        questions: [{ id: 1, answer: 'Option A' }]
      };

      const mockAssessmentId = 'assessment456';
      const mockAssessment = { score: 75, passed: true, endTimestamp: '2023-01-01T10:00:00Z' };

      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.submitAssessment(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments',
        expect.objectContaining({
          userType: 'Caregiver'
        }),
        expect.any(Object)
      );
    });

    it('should handle missing userId', async () => {
      req.body = {
        questions: [{ id: 1, answer: 'Option A' }]
      };

      await assessmentController.submitAssessment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid assessment data. UserId and questions are required."
      });
    });

    it('should handle missing questions', async () => {
      req.body = {
        userId: 'user123'
      };

      await assessmentController.submitAssessment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid assessment data. UserId and questions are required."
      });
    });

    it('should handle empty request body', async () => {
      req.body = null;

      await assessmentController.submitAssessment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid assessment data. UserId and questions are required."
      });
    });

    it('should handle undefined request body', async () => {
      req.body = undefined;

      await assessmentController.submitAssessment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid assessment data. UserId and questions are required."
      });
    });

    it('should handle empty questions array', async () => {
      req.body = {
        userId: 'user123',
        questions: []
      };

      const mockAssessmentId = 'assessment456';
      const mockAssessment = { score: 0, passed: false, endTimestamp: '2023-01-01T10:00:00Z' };

      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.submitAssessment(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments',
        expect.objectContaining({
          questions: []
        }),
        expect.any(Object)
      );
    });

    it('should handle axios post error', async () => {
      req.body = {
        userId: 'user123',
        questions: [{ id: 1, answer: 'Option A' }]
      };

      const mockError = new Error('Post error');
      mockAxios.post.mockRejectedValue(mockError);

      await assessmentController.submitAssessment(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, mockError, 'Error submitting assessment');
    });

    it('should handle axios get error (for retrieving results)', async () => {
      req.body = {
        userId: 'user123',
        questions: [{ id: 1, answer: 'Option A' }]
      };

      const mockAssessmentId = 'assessment456';
      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      
      const mockError = new Error('Get error');
      mockAxios.get.mockRejectedValue(mockError);

      await assessmentController.submitAssessment(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, mockError, 'Error submitting assessment');
    });

    it('should handle missing authorization header in submit', async () => {
      req.body = {
        userId: 'user123',
        questions: [{ id: 1, answer: 'Option A' }]
      };
      req.headers = {};

      const mockAssessmentId = 'assessment456';
      const mockAssessment = { score: 85, passed: true, endTimestamp: '2023-01-01T10:00:00Z' };

      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.submitAssessment(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': ''
          }
        }
      );
    });
  });

  describe('getUserAssessmentHistory Function Coverage', () => {
    it('should get user assessment history successfully', async () => {
      req.params.userId = 'user123';
      const mockAssessments = [
        {
          id: 'assessment1',
          endTimestamp: '2023-01-01T10:00:00Z',
          score: 85,
          passed: true,
          userType: 'Caregiver'
        },
        {
          id: 'assessment2',
          endTimestamp: '2023-01-02T10:00:00Z',
          score: 75,
          passed: true,
          userType: 'Caregiver'
        }
      ];

      mockAxios.get.mockResolvedValue({ data: mockAssessments });

      await assessmentController.getUserAssessmentHistory(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/user/user123',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 'assessment1',
            timestamp: '2023-01-01T10:00:00Z',
            score: 85,
            passed: true,
            userType: 'Caregiver'
          },
          {
            id: 'assessment2',
            timestamp: '2023-01-02T10:00:00Z',
            score: 75,
            passed: true,
            userType: 'Caregiver'
          }
        ]
      });
    });

    it('should handle empty assessment history', async () => {
      req.params.userId = 'user123';
      mockAxios.get.mockResolvedValue({ data: [] });

      await assessmentController.getUserAssessmentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should handle axios error in getUserAssessmentHistory', async () => {
      req.params.userId = 'user123';
      const mockError = new Error('Network error');
      mockAxios.get.mockRejectedValue(mockError);

      await assessmentController.getUserAssessmentHistory(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, mockError, 'Error fetching assessment history');
    });

    it('should handle missing authorization header in getUserAssessmentHistory', async () => {
      req.params.userId = 'user123';
      req.headers = {};
      mockAxios.get.mockResolvedValue({ data: [] });

      await assessmentController.getUserAssessmentHistory(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/user/user123',
        { headers: { 'Authorization': '' } }
      );
    });
  });

  describe('getAssessmentById Function Coverage', () => {
    it('should get assessment by ID successfully', async () => {
      req.params.id = 'assessment123';
      const mockAssessment = {
        id: 'assessment123',
        userId: 'user123',
        score: 90,
        passed: true,
        endTimestamp: '2023-01-01T10:00:00Z',
        userType: 'Caregiver'
      };

      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.getAssessmentById(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/assessment123',
        { headers: { 'Authorization': 'Bearer test-token' } }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAssessment
      });
    });

    it('should handle axios error in getAssessmentById', async () => {
      req.params.id = 'assessment123';
      const mockError = new Error('Assessment not found');
      mockAxios.get.mockRejectedValue(mockError);

      await assessmentController.getAssessmentById(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, mockError, 'Error fetching assessment');
    });

    it('should handle missing authorization header in getAssessmentById', async () => {
      req.params.id = 'assessment123';
      req.headers = {};
      const mockAssessment = { id: 'assessment123' };
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.getAssessmentById(req, res);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments/assessment123',
        { headers: { 'Authorization': '' } }
      );
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof assessmentController.getAssessmentQuestions).toBe('function');
      expect(typeof assessmentController.submitAssessment).toBe('function');
      expect(typeof assessmentController.getUserAssessmentHistory).toBe('function');
      expect(typeof assessmentController.getAssessmentById).toBe('function');
    });

    it('should export the correct number of functions', () => {
      const exportedKeys = Object.keys(assessmentController);
      expect(exportedKeys).toHaveLength(4);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle malformed assessment data in submit', async () => {
      req.body = {
        userId: 'user123',
        questions: 'invalid-questions-format'
      };

      await assessmentController.submitAssessment(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(
        res, 
        expect.any(Error), 
        'Error submitting assessment'
      );
    });

    it('should handle questions with missing properties during formatting', async () => {
      req.body = {
        userId: 'user123',
        questions: [
          { id: 1 }, // missing answer
          { answer: 'Option B' }, // missing id
          {} // missing both
        ]
      };

      const mockAssessmentId = 'assessment456';
      const mockAssessment = { score: 50, passed: false, endTimestamp: '2023-01-01T10:00:00Z' };

      mockAxios.post.mockResolvedValue({ data: mockAssessmentId });
      mockAxios.get.mockResolvedValue({ data: mockAssessment });

      await assessmentController.submitAssessment(req, res);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:5145/api/Assessments',
        expect.objectContaining({
          questions: [
            { questionId: 1, userAnswer: undefined },
            { questionId: undefined, userAnswer: 'Option B' },
            { questionId: undefined, userAnswer: undefined }
          ]
        }),
        expect.any(Object)
      );
    });

    it('should handle network timeout in getAssessmentQuestions', async () => {
      req.params.userType = 'Caregiver';
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockAxios.get.mockRejectedValue(timeoutError);

      await assessmentController.getAssessmentQuestions(req, res);

      expect(mockHandleError).toHaveBeenCalledWith(res, timeoutError, 'Error fetching assessment questions');
    });
  });
});
