const { verifyUser } = require('../../../__mocks__/authController');

describe('🔐 Auth Controller Unit Tests - Coverage Focused', () => {
  describe('verifyUser Function Coverage', () => {
    it('should handle successful user verification', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await verifyUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle missing email field', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await verifyUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle missing firstName field', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          lastName: 'Doe'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await verifyUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty request body', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await verifyUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle user not found', async () => {
      const req = {
        body: {
          email: 'notfound@example.com',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await verifyUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});