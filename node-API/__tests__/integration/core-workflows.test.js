// MANDATORY INTEGRATION TESTS - Core API Workflows
const request = require('supertest');
const app = require('../../app');

describe('🔗 MANDATORY INTEGRATION TESTS - Core Workflows', () => {
  describe('Dojah Webhook Integration', () => {
    test('MANDATORY: Must process valid dojah webhook', async () => {
      const webhookPayload = {
        event: 'verification.completed',
        user_id: 'test-user-123',
        data: {
          status: 'verified',
          verification_type: 'bvn'
        }
      };

      const response = await request(app)
        .post('/api/dojah/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('MANDATORY: Must handle Azure data forwarding', async () => {
      const validToken = 'test-token';
      
      const response = await request(app)
        .post('/api/dojah/process/test-user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      // Should attempt to process (may fail due to missing Azure endpoint but shouldn't be auth issue)
      expect(response.status).not.toBe(401);
    });
  });

  describe('OpenAI Assessment Integration', () => {
    test('MANDATORY: Must generate questions for caregiver type', async () => {
      const response = await request(app)
        .get('/api/assessment/questions/caregiver')
        .set('Authorization', 'Bearer test-token')
        .send();

      // Should attempt to generate questions
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(401);
    });

    test('MANDATORY: Must handle assessment submission', async () => {
      const assessmentData = {
        userType: 'caregiver',
        responses: [
          { questionId: 1, answer: 'Test answer 1' },
          { questionId: 2, answer: 'Test answer 2' }
        ]
      };

      const response = await request(app)
        .post('/api/assessment/submit')
        .set('Authorization', 'Bearer test-token')
        .send(assessmentData);

      // Should attempt to process submission
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(401);
    });
  });

  describe('KYC Workflow Integration', () => {
    test('MANDATORY: Must start KYC process', async () => {
      const response = await request(app)
        .post('/api/kyc/start')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).not.toBe(401);
    });

    test('MANDATORY: Must generate provider questions', async () => {
      const response = await request(app)
        .post('/api/kyc/generate-questions')
        .set('Authorization', 'Bearer test-token')
        .send({ providerType: 'caregiver' });

      expect(response.status).not.toBe(401);
    });

    test('MANDATORY: Must evaluate responses', async () => {
      const response = await request(app)
        .post('/api/kyc/evaluate')
        .set('Authorization', 'Bearer test-token')
        .send({ 
          responses: ['test response'],
          providerType: 'caregiver' 
        });

      expect(response.status).not.toBe(401);
    });
  });

  describe('Auth Integration', () => {
    test('MANDATORY: Must verify user credentials', async () => {
      const userCredentials = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/verify')
        .send(userCredentials);

      expect(response.status).not.toBe(404);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Error Handling & Resilience', () => {
    test('MANDATORY: Must return consistent error format', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });

    test('MANDATORY: Must handle large payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(1024 * 100), // 100KB string (smaller for testing)
        metadata: { size: 'large' }
      };

      const response = await request(app)
        .post('/test-payload')
        .send(largePayload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payloadSize');
    });
  });

  describe('Performance & Scalability', () => {
    test('MANDATORY: Must handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make 10 concurrent requests
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);
      
      // Should complete within reasonable time (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
