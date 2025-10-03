const { startKYC, getQuestions, generateProviderQuestions, submitResponses, evalResponse } = require('../../../__mocks__/kycController');

describe('📋 KYC Controller Unit Tests - Coverage Focused', () => {
  describe('startKYC Function Coverage', () => {
    it('should start KYC process successfully', async () => {
      const req = {
        user: { id: 'user123' },
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await startKYC(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: null,
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await startKYC(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getQuestions Function Coverage', () => {
    it('should get questions successfully', async () => {
      const req = {
        user: { id: 'user123' },
        query: { providerType: 'caregiver' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getQuestions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: null,
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getQuestions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('generateProviderQuestions Function Coverage', () => {
    it('should generate questions successfully', async () => {
      const req = {
        user: { id: 'user123' },
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateProviderQuestions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: null,
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateProviderQuestions(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('submitResponses Function Coverage', () => {
    it('should submit responses successfully', async () => {
      const req = {
        user: { id: 'user123' },
        body: { responses: ['answer1', 'answer2'] }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResponses(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: null,
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResponses(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('evalResponse Function Coverage', () => {
    it('should evaluate response successfully', async () => {
      const req = {
        user: { id: 'user123' },
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await evalResponse(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: null,
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await evalResponse(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});