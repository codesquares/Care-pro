/**
 * 🔗 Integration Controller Unit Tests - Maximum Coverage Focus
 * Testing all functions with comprehensive coverage including edge cases
 */

const axios = require('axios');
const integrationController = require('../../../src/controllers/integrationController');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock environment variables
process.env.API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api';
process.env.INTERNAL_API_KEY = 'test-key';

describe('🔗 Integration Controller Unit Tests - Coverage Focused', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getUserVerificationStatus Function Coverage', () => {
    it('should get verification status successfully', async () => {
      req.params.userId = 'test-user-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: {
            id: 'test-user-123',
            verificationStatus: 'verified',
            completedAt: '2024-01-01'
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getUserVerificationStatus(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/users/test-user-123/verification-status',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResponse.data.data
      });
    });

    it('should handle missing userId parameter', async () => {
      await integrationController.getUserVerificationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User ID is required'
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle missing authorization header', async () => {
      req.params.userId = 'test-user-123';
      
      const mockResponse = {
        data: {
          data: {
            id: 'test-user-123',
            verificationStatus: 'pending'
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getUserVerificationStatus(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/users/test-user-123/verification-status',
        {
          headers: {
            'Authorization': 'Bearer test-key'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle verification status not found', async () => {
      req.params.userId = 'test-user-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {}
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getUserVerificationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Verification status not found'
      });
    });

    it('should handle API error', async () => {
      req.params.userId = 'test-user-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockError = new Error('API Error');
      mockedAxios.get.mockRejectedValue(mockError);

      await integrationController.getUserVerificationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'An error occurred while getting user verification status',
        error: 'API Error'
      });
    });

    it('should handle null response data', async () => {
      req.params.userId = 'test-user-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getUserVerificationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Verification status not found'
      });
    });
  });

  describe('getProviderServiceData Function Coverage', () => {
    it('should get provider service data successfully', async () => {
      req.params.providerId = 'provider-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: [{
            id: 'provider-123',
            serviceName: 'Elderly Care',
            description: 'Professional elderly care service'
          }]
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getProviderServiceData(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/provider-services?providerId=provider-123',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResponse.data.data[0]
      });
    });

    it('should handle missing providerId parameter', async () => {
      await integrationController.getProviderServiceData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Provider ID is required'
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle missing authorization header with fallback', async () => {
      req.params.providerId = 'provider-123';
      
      const mockResponse = {
        data: {
          data: [{
            id: 'provider-123',
            serviceName: 'Home Care'
          }]
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getProviderServiceData(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/provider-services?providerId=provider-123',
        {
          headers: {
            'Authorization': 'Bearer test-key'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle provider service not found', async () => {
      req.params.providerId = 'provider-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: []
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getProviderServiceData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Provider service profile not found'
      });
    });

    it('should handle null response data', async () => {
      req.params.providerId = 'provider-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getProviderServiceData(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Provider service profile not found'
      });
    });

    it('should handle API error', async () => {
      req.params.providerId = 'provider-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(mockError);

      await integrationController.getProviderServiceData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'An error occurred while getting provider service data',
        error: 'Network Error'
      });
    });
  });

  describe('getClientServiceRequests Function Coverage', () => {
    it('should get client service requests successfully', async () => {
      req.params.clientId = 'client-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: [
            {
              id: 'request-1',
              clientId: 'client-123',
              serviceType: 'Home Care'
            },
            {
              id: 'request-2',
              clientId: 'client-123',
              serviceType: 'Medical Care'
            }
          ]
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getClientServiceRequests(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/client-service-requests?clientId=client-123',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: mockResponse.data.data
      });
    });

    it('should handle missing clientId parameter', async () => {
      await integrationController.getClientServiceRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Client ID is required'
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle missing authorization header with fallback', async () => {
      req.params.clientId = 'client-123';
      
      const mockResponse = {
        data: {
          data: []
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getClientServiceRequests(req, res);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/client-service-requests?clientId=client-123',
        {
          headers: {
            'Authorization': 'Bearer test-key'
          }
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle empty service requests', async () => {
      req.params.clientId = 'client-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: []
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getClientServiceRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 0,
        data: []
      });
    });

    it('should handle null response data', async () => {
      req.params.clientId = 'client-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockResponse = {
        data: {
          data: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await integrationController.getClientServiceRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: 0,
        data: []
      });
    });

    it('should handle API error', async () => {
      req.params.clientId = 'client-123';
      req.headers.authorization = 'Bearer test-token';
      
      const mockError = new Error('Connection Timeout');
      mockedAxios.get.mockRejectedValue(mockError);

      await integrationController.getClientServiceRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'An error occurred while getting client service requests',
        error: 'Connection Timeout'
      });
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof integrationController.getUserVerificationStatus).toBe('function');
      expect(typeof integrationController.getProviderServiceData).toBe('function');
      expect(typeof integrationController.getClientServiceRequests).toBe('function');
    });

    it('should export the correct number of functions', () => {
      const exportedFunctions = Object.keys(integrationController);
      expect(exportedFunctions).toHaveLength(3);
    });
  });
});
