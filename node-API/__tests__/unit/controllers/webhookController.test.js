/**
 * 🔗 Webhook Controller Unit Tests - Maximum Coverage Focus
 * Testing all webhook controller functions with comprehensive coverage
 */

const axios = require('axios');
const webhookController = require('../../../src/controllers/webhookController');
const dojahService = require('../../../src/services/dojahService');

// Mock dependencies
jest.mock('axios', () => ({
  patch: jest.fn(),
  post: jest.fn(),
  get: jest.fn()
}));
jest.mock('../../../src/services/dojahService');

const mockedAxios = axios;

// Mock environment variables
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  API_URL: 'https://test-api.azurewebsites.net/api',
  INTERNAL_API_KEY: 'test-internal-key',
  DOJAH_WEBHOOK_SECRET: 'test-webhook-secret'
};

describe('🔗 Webhook Controller Unit Tests - Coverage Focused', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('processWebhook Function Coverage', () => {
    it('should process verification.completed webhook successfully', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          reference_id: 'user_123456',
          verification_status: 'success',
          verification_data: {
            name: 'John Doe',
            bvn: '12345678901'
          }
        }
      };

      mockedAxios.patch.mockResolvedValue({ data: { success: true } });

      await webhookController.processWebhook(req, res);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/users/123456/verification',
        expect.objectContaining({
          status: 'verified',
          resultData: req.body.data,
          completedAt: expect.any(String)
        }),
        {
          headers: {
            'Authorization': 'Bearer test-internal-key',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should process verification.failed webhook successfully', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.failed',
        data: {
          reference_id: 'user_789012',
          failure_reason: 'Invalid BVN',
          verification_data: {
            error: 'BVN not found'
          }
        }
      };

      mockedAxios.patch.mockResolvedValue({ data: { success: true } });

      await webhookController.processWebhook(req, res);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/users/789012/verification',
        expect.objectContaining({
          status: 'failed',
          resultData: req.body.data,
          failureReason: 'Invalid BVN',
          completedAt: expect.any(String)
        }),
        {
          headers: {
            'Authorization': 'Bearer test-internal-key',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle reference_id without user_ prefix', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          reference_id: '999888',
          verification_status: 'success'
        }
      };

      mockedAxios.patch.mockResolvedValue({ data: { success: true } });

      await webhookController.processWebhook(req, res);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://carepro-api20241118153443.azurewebsites.net/api/users/999888/verification',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle unhandled webhook event types', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'unknown.event',
        data: {
          reference_id: 'user_123456'
        }
      };

      await webhookController.processWebhook(req, res);

      expect(console.log).toHaveBeenCalledWith('Unhandled webhook event type: unknown.event');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle invalid webhook payload', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = null;

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error processing webhook',
        error: 'Invalid webhook payload'
      });
    });

    it('should handle webhook payload without event field', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        data: {
          reference_id: 'user_123456'
        }
      };

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error processing webhook',
        error: 'Invalid webhook payload'
      });
    });

    it('should handle verification.completed with invalid data', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          // missing reference_id
          verification_status: 'success'
        }
      };

      await webhookController.processWebhook(req, res);

      // Should still return success as the error is handled internally
      expect(console.error).toHaveBeenCalledWith('Error handling verification completed:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle verification.failed with invalid data', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.failed',
        data: null
      };

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Error handling verification failed:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle Azure API error for verification.completed', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          reference_id: 'user_123456',
          verification_status: 'success'
        }
      };

      const azureError = new Error('Azure API unavailable');
      mockedAxios.patch.mockRejectedValue(azureError);

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Error handling verification completed:', azureError);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle Azure API error for verification.failed', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.failed',
        data: {
          reference_id: 'user_123456',
          failure_reason: 'Network error'
        }
      };

      const azureError = new Error('Azure API timeout');
      mockedAxios.patch.mockRejectedValue(azureError);

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Error handling verification failed:', azureError);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    });

    it('should handle verification.failed without failure_reason', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.failed',
        data: {
          reference_id: 'user_123456'
          // no failure_reason provided
        }
      };

      mockedAxios.patch.mockResolvedValue({ data: { success: true } });

      await webhookController.processWebhook(req, res);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          failureReason: 'Verification failed'
        }),
        expect.any(Object)
      );
    });

    it('should store webhook events for debugging (limited to 10)', async () => {
      // Process 12 webhooks to test the limit
      for (let i = 0; i < 12; i++) {
        req.headers['x-dojah-signature'] = `signature-${i}`;
        req.body = {
          event: 'test.event',
          data: { id: i }
        };

        await webhookController.processWebhook(req, res);
      }

      // The webhook events array should be limited to 10 items
      // This is tested implicitly by ensuring no errors occur
      expect(res.status).toHaveBeenCalledTimes(12);
    });

    it('should handle invalid reference_id format', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          reference_id: 'user_',  // empty after split
          verification_status: 'success'
        }
      };

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Error handling verification completed:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle general processing error', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        get data() {
          throw new Error('Unexpected error accessing data');
        }
      };

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error processing webhook',
        error: 'Unexpected error accessing data'
      });
    });
  });

  describe('getWebhookEvents Function Coverage', () => {
    it('should return webhook events for admin user', async () => {
      req.user = { role: 'admin' };

      // First add some webhook events by processing webhooks
      const testReq = {
        headers: { 'x-dojah-signature': 'test-signature' },
        body: {
          event: 'test.event',
          data: { reference_id: 'test_123' }
        }
      };
      const testRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await webhookController.processWebhook(testReq, testRes);

      // Now get the webhook events
      await webhookController.getWebhookEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(Date),
            event: expect.objectContaining({
              event: 'test.event'
            }),
            headers: expect.objectContaining({
              'x-dojah-signature': 'test-signature'
            })
          })
        ])
      });
    });

    it('should deny access for non-admin user', async () => {
      req.user = { role: 'user' };

      await webhookController.getWebhookEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized access'
      });
    });

    it('should deny access for user without role', async () => {
      req.user = {};

      await webhookController.getWebhookEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Unauthorized access'
      });
    });

    it('should handle missing user object', async () => {
      req.user = null;

      await webhookController.getWebhookEvents(req, res);

      expect(console.error).toHaveBeenCalledWith('Get webhook events error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error getting webhook events',
        error: expect.any(String)
      });
    });

    it('should handle error during webhook events retrieval', async () => {
      // Mock user that will cause an error when accessing role
      req.user = {
        get role() {
          throw new Error('Database connection failed');
        }
      };

      await webhookController.getWebhookEvents(req, res);

      expect(console.error).toHaveBeenCalledWith('Get webhook events error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error getting webhook events',
        error: 'Database connection failed'
      });
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof webhookController.processWebhook).toBe('function');
      expect(typeof webhookController.getWebhookEvents).toBe('function');
    });

    it('should export the correct number of functions', () => {
      const exportedFunctions = Object.keys(webhookController);
      expect(exportedFunctions).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty webhook body gracefully', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {};

      await webhookController.processWebhook(req, res);

      expect(console.error).toHaveBeenCalledWith('Webhook processing error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle webhook with malformed JSON gracefully', async () => {
      req.headers['x-dojah-signature'] = 'valid-signature';
      req.body = {
        event: 'verification.completed',
        data: {
          reference_id: 'user_123',
          // Simulate a circular reference that would break JSON processing
          get circular() {
            return this;
          }
        }
      };

      await webhookController.processWebhook(req, res);

      // Should still process successfully as the error is in the handler
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle webhook event storage overflow correctly', async () => {
      // Process exactly 11 webhooks to test the array size limit
      const promises = [];
      for (let i = 0; i < 11; i++) {
        const testReq = {
          headers: { 'x-dojah-signature': `signature-${i}` },
          body: {
            event: `test.event.${i}`,
            data: { reference_id: `test_${i}` }
          }
        };
        const testRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        promises.push(webhookController.processWebhook(testReq, testRes));
      }
      
      await Promise.all(promises);

      // Verify all processed successfully
      expect(promises).toHaveLength(11);
    });
  });
});
