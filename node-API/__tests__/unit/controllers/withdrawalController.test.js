const withdrawalController = require('../../../src/controllers/withdrawalController');
const { generateWithdrawalRequest } = require('../../../src/services/withdrawalService');

// Mock the withdrawal service
jest.mock('../../../src/services/withdrawalService');

describe('💰 Withdrawal Controller Unit Tests - Coverage Focused', () => {
  let req, res;
  let consoleSpy;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('withdrawFunds Function Coverage', () => {
    it('should process withdrawal request successfully', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      const mockWithdrawalResponse = {
        success: true,
        data: {
          withdrawalId: 'withdrawal-456',
          status: 'pending'
        },
        status: 201,
        message: 'Withdrawal request created successfully'
      };

      generateWithdrawalRequest.mockResolvedValueOnce(mockWithdrawalResponse);

      await withdrawalController.withdrawFunds(req, res);

      expect(generateWithdrawalRequest).toHaveBeenCalledWith({
        caregiverId: 'caregiver123',
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        token: 'withdrawal-token-123'
      });

      expect(consoleSpy.log).toHaveBeenCalledWith("Withdrawal Request Body:", req.body);
      expect(consoleSpy.log).toHaveBeenCalledWith("Withdrawal Response:", mockWithdrawalResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Withdrawal request submitted successfully.",
        data: {
          withdrawalId: 'withdrawal-456',
          status: 'pending'
        },
        status: "success"
      });
    });

    it('should handle missing amountRequested', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["amountRequested"]
      });
      expect(generateWithdrawalRequest).not.toHaveBeenCalled();
    });

    it('should handle missing caregiverId', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["caregiverId"]
      });
    });

    it('should handle missing accountNumber', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        bankName: 'Test Bank',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["accountNumber"]
      });
    });

    it('should handle missing bankName', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["bankName"]
      });
    });

    it('should handle missing accountName', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        caregiverId: 'caregiver123'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["accountName"]
      });
    });

    it('should handle missing token', async () => {
      req.headers = {}; // No authorization header
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "Authorization token is required."
      });
    });

    it('should handle service error', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        caregiverId: 'caregiver123'
      };

      const error = new Error('Withdrawal service failed');
      generateWithdrawalRequest.mockRejectedValueOnce(error);

      await withdrawalController.withdrawFunds(req, res);

      expect(generateWithdrawalRequest).toHaveBeenCalledWith({
        caregiverId: 'caregiver123',
        amountRequested: 1000,
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        accountName: 'John Doe',
        token: 'withdrawal-token-123'
      });

      expect(consoleSpy.error).toHaveBeenCalledWith("=== CONTROLLER ERROR HANDLING ===");

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "Withdrawal service failed"
      });
    });

    it('should handle all falsy values correctly', async () => {
      req.headers = {
        authorization: 'Bearer withdrawal-token-123'
      };
      req.body = {
        amountRequested: 0,
        accountNumber: '',
        bankName: null,
        accountName: undefined,
        caregiverId: false
      };

      await withdrawalController.withdrawFunds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessage: "All fields are required.",
        missingFields: ["amountRequested", "caregiverId", "accountNumber", "bankName", "accountName"]
      });
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof withdrawalController.withdrawFunds).toBe('function');
    });

    it('should export the correct number of functions', () => {
      const exportedKeys = Object.keys(withdrawalController);
      expect(exportedKeys).toHaveLength(1);
      expect(exportedKeys).toEqual(['withdrawFunds']);
    });
  });
});
