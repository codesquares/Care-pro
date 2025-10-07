/**
 * 🛡️ Assessment Auth Middleware Unit Tests - Maximum Coverage Focus
 * Testing all authentication middleware functions with comprehensive coverage
 */

const assessmentAuth = require('../../../src/middleware/assessmentAuthMiddleware');

describe('🛡️ Assessment Auth Middleware Unit Tests - Coverage Focused', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assessmentAuth Middleware Coverage', () => {
    it('should authenticate request with valid Bearer token and userId in body', () => {
      req.headers.authorization = 'Bearer valid-test-token';
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(req.user).toEqual({
        id: 'user-123',
        token: 'valid-test-token'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should authenticate request with valid Bearer token and userId in query', () => {
      req.headers.authorization = 'Bearer another-token';
      req.query.userId = 'user-456';

      assessmentAuth(req, res, next);

      expect(req.user).toEqual({
        id: 'user-456',
        token: 'another-token'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should prioritize userId from body over query', () => {
      req.headers.authorization = 'Bearer priority-token';
      req.body.userId = 'body-user';
      req.query.userId = 'query-user';

      assessmentAuth(req, res, next);

      expect(req.user).toEqual({
        id: 'body-user',
        token: 'priority-token'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should reject request with empty authorization header', () => {
      req.headers.authorization = '';
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header (not Bearer)', () => {
      req.headers.authorization = 'Basic invalid-auth';
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with Bearer token but missing userId', () => {
      req.headers.authorization = 'Bearer valid-token';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required for authentication'
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should reject request with Bearer token but empty userId in body', () => {
      req.headers.authorization = 'Bearer valid-token';
      req.body.userId = '';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required for authentication'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with Bearer token but null userId', () => {
      req.headers.authorization = 'Bearer valid-token';
      req.body.userId = null;

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required for authentication'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Bearer token without space correctly', () => {
      req.headers.authorization = 'Bearer';
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized, no token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Bearer token with multiple spaces', () => {
      req.headers.authorization = 'Bearer   multi-space-token';
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      // When splitting 'Bearer   multi-space-token' by ' ', we get:
      // ['Bearer', '', '', 'multi-space-token'] and split(' ')[1] gives us ''
      expect(req.user).toEqual({
        id: 'user-123',
        token: '' // The first space after Bearer gives an empty string
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle exception during token processing', () => {
      // Create a malformed authorization header that will cause split to fail
      req.headers = {
        get authorization() {
          throw new Error('Header processing error');
        }
      };
      req.body.userId = 'user-123';

      assessmentAuth(req, res, next);

      expect(console.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle exception during user ID extraction', () => {
      req.headers.authorization = 'Bearer valid-token';
      // Mock body that throws error when accessed
      Object.defineProperty(req, 'body', {
        get() {
          throw new Error('Body access error');
        }
      });

      assessmentAuth(req, res, next);

      expect(console.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle various falsy userId values', () => {
      const falsyValues = [0, false, undefined, null, ''];
      
      falsyValues.forEach(value => {
        // Reset mocks for each iteration
        jest.clearAllMocks();
        
        req.headers.authorization = 'Bearer valid-token';
        req.body.userId = value;
        req.query.userId = undefined;

        assessmentAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'User ID is required for authentication'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('Module Export Coverage', () => {
    it('should export assessmentAuth as default function', () => {
      expect(typeof assessmentAuth).toBe('function');
      expect(assessmentAuth.name).toBe('assessmentAuth');
    });
  });
});
