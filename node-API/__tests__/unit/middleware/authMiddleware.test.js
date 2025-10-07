// __tests__/unit/middleware/authMiddleware.test.js
const { protect, protectUser } = require('../../../src/middleware/authMiddleware');
const axios = require('axios');

// Mock external dependencies
jest.mock('axios');

describe('🛡️ Auth Middleware Unit Tests - Coverage Focused', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      query: {},
      body: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('protect Middleware Coverage', () => {
    it('should handle requests with authorization header', async () => {
      req.headers.authorization = 'Bearer valid-token-123';
      req.query.userId = 'user123';
      
      axios.get.mockResolvedValueOnce({
        data: { success: true, user: { id: 'user123' } }
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalled();
    });

    it('should handle requests without authorization header', async () => {
      req.headers.authorization = undefined;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle invalid token format', async () => {
      req.headers.authorization = 'InvalidToken123';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('protectUser Function Coverage', () => {
    it('should return null for missing userId', async () => {
      const result = await protectUser(null, 'valid-token');
      expect(result).toBeNull();
    });

    it('should return null for missing token', async () => {
      const result = await protectUser('user123', null);
      expect(result).toBeNull();
    });

    it('should return null for invalid credentials', async () => {
      const result = await protectUser(null, 'invalid-token');
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await protectUser('user123', 'token');
      expect(result).toBeNull();
    });
  });
});
