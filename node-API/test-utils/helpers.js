// Test helper utilities and fixtures

/**
 * Mock External API Responses
 */
const mockApiResponses = {
  // Azure API successful user verification
  azureUserVerificationSuccess: {
    success: true,
    user: {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      verificationStatus: {
        idVerified: false,
        addressVerified: false,
        qualificationVerified: false
      }
    }
  },

  // Azure API user not found
  azureUserVerificationNotFound: {
    success: false,
    message: 'User not found'
  },

  // Dojah NIN verification success
  dojahNinVerificationSuccess: {
    entity: {
      first_name: "John",
      last_name: "Doe",
      middle_name: "Chinwe",
      gender: "M",
      phone_number: "0812345678",
      date_of_birth: "1993-05-06",
      nin: "12345678901",
      verification_status: "success",
      verified: true
    },
    status: true
  },

  // Dojah NIN verification failure
  dojahNinVerificationFailure: {
    entity: {
      nin: "12345678901",
      verification_status: "failed",
      verified: false
    },
    status: false,
    message: "NIN verification failed"
  },

  // OpenAI question generation success
  openAiQuestionsSuccess: [
    "What steps do you take when assisting a client with mobility issues?",
    "How do you handle a medical emergency with a client?",
    "What techniques do you use to encourage a client to eat?",
    "How do you assist a client with dementia when they become confused?",
    "What are the key signs of bedsores and how do you prevent them?"
  ],

  // OpenAI evaluation success
  openAiEvaluationSuccess: {
    score: 85,
    evaluation: "Excellent responses showing deep understanding",
    feedback: "The candidate demonstrates strong knowledge and experience",
    improvements: null,
    passThreshold: 70
  }
};

/**
 * Test User Fixtures
 */
const testUsers = {
  validUser: {
    _id: 'user123',
    id: 'user123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'caregiver',
    verificationStatus: {
      idVerified: false,
      addressVerified: false,
      qualificationVerified: false
    }
  },

  adminUser: {
    _id: 'admin123',
    id: 'admin123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    verificationStatus: {
      idVerified: true,
      addressVerified: true,
      qualificationVerified: true
    }
  }
};

/**
 * Test Request Bodies
 */
const testRequestBodies = {
  validUserVerification: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  },

  validKycResponses: {
    responses: [
      "I always ensure proper body mechanics when assisting clients",
      "I would immediately call emergency services and provide first aid",
      "I use encouragement and make meals appealing and social",
      "I remain calm, redirect attention, and use familiar objects",
      "I check for red, warm areas and ensure regular position changes"
    ],
    providerType: 'caregiver'
  },

  validWebhookPayload: {
    status: true,
    verification_status: 'Completed',
    user_id: 'user123',
    entity: {
      first_name: "John",
      last_name: "Doe",
      nin: "12345678901",
      verification_status: "success",
      verified: true
    }
  },

  invalidWebhookPayload: {
    status: false,
    verification_status: 'Failed',
    error: 'Verification failed'
  }
};

/**
 * Security Test Data
 */
const securityTestData = {
  maliciousPayloads: [
    { user_id: 'admin123' }, // Admin user attempt
    { user_id: 'system_user' }, // System user attempt
    { user_id: '<script>alert("xss")</script>' }, // XSS attempt
    { user_id: '"; DROP TABLE users; --' }, // SQL injection attempt
    { user_id: 'user123\x00admin' }, // Null byte injection
  ],

  invalidSignatures: [
    'invalid-signature',
    'sha256=invalid-hash',
    '',
    null,
    undefined
  ],

  rateLimitTestIps: [
    '192.168.1.1',
    '192.168.1.2',
    '192.168.1.3',
    '10.0.0.1',
    '127.0.0.1'
  ]
};

/**
 * Helper Functions
 */
const testHelpers = {
  /**
   * Generate a valid JWT token for testing
   */
  generateValidJWT: (payload = { id: 'user123' }) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
  },

  /**
   * Generate invalid JWT token
   */
  generateInvalidJWT: () => {
    return 'invalid.jwt.token';
  },

  /**
   * Generate webhook signature
   */
  generateWebhookSignature: (payload, secret = 'test-webhook-secret') => {
    const crypto = require('crypto');
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return 'sha256=' + crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  },

  /**
   * Wait for a specified time (for rate limiting tests)
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create multiple requests for rate limiting tests
   */
  createMultipleRequests: (count, ip = '192.168.1.1') => {
    return Array.from({ length: count }, (_, i) => ({
      headers: { 'x-forwarded-for': ip },
      body: { test: `request-${i}` },
      ip
    }));
  },

  /**
   * Validate PII sanitization
   */
  validatePiiSanitization: (data) => {
    const sensitiveFields = [
      'bvn', 'nin', 'phone_number', 'phone_number1', 'date_of_birth',
      'first_name', 'last_name', 'middle_name', 'email', 'address'
    ];
    
    const jsonString = JSON.stringify(data);
    for (const field of sensitiveFields) {
      if (jsonString.includes(field) && !jsonString.includes('[REDACTED]')) {
        const regex = new RegExp(`"${field}":\\s*"(?!\\[REDACTED\\])[^"]+"`);
        if (regex.test(jsonString)) {
          return false;
        }
      }
    }
    return true;
  }
};

/**
 * Mock External Services
 */
const mockServices = {
  /**
   * Mock successful external API calls
   */
  mockSuccessfulExternalApis: () => {
    const axios = require('axios');
    axios.post.mockResolvedValue({ data: mockApiResponses.azureUserVerificationSuccess });
    axios.get.mockResolvedValue({ data: mockApiResponses.dojahNinVerificationSuccess });
  },

  /**
   * Mock failed external API calls
   */
  mockFailedExternalApis: () => {
    const axios = require('axios');
    axios.post.mockRejectedValue(new Error('Network error'));
    axios.get.mockRejectedValue(new Error('Service unavailable'));
  },

  /**
   * Reset all mocks
   */
  resetMocks: () => {
    jest.clearAllMocks();
  }
};

module.exports = {
  mockApiResponses,
  testUsers,
  testRequestBodies,
  securityTestData,
  testHelpers,
  mockServices
};
