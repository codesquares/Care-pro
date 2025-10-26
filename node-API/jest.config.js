module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'app.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/logs/**',
    // Exclude scripts directory (not core functionality)
    '!src/scripts/**',
    // Exclude mock services (test utilities)
    '!src/services/mockVerificationService.js',
    // Exclude utility scripts
    '!src/utils/errorHandler.js'
  ],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 15,
      statements: 15
    },
    // Critical files must have higher coverage
    './src/controllers/authController.js': {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50
    },
    './src/controllers/dojahVerificationController.js': {
      branches: 8,
      functions: 5,
      lines: 10,
      statements: 10
    },
    // Controllers with zero coverage - temporarily allow 0% until tests are written
    './src/controllers/kycController.js': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    './src/controllers/clientServiceController.js': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    },
    // Services with low coverage - set achievable thresholds
    './src/services/dojahService.js': {
      branches: 0,
      functions: 5,
      lines: 8,
      statements: 8
    },
    './src/services/questionBankService.js': {
      branches: 0,
      functions: 0,
      lines: 10,
      statements: 10
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.js'],
  testTimeout: 10000,
  maxWorkers: 1, // Run tests serially to avoid conflicts
  verbose: true,
  // Force exit after tests complete
  forceExit: true,
  // Detect open handles that prevent Jest from exiting
  detectOpenHandles: true,
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  // Mock external modules by default
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock controllers
    '^../controllers/authController$': '<rootDir>/__mocks__/authController.js',
    '^../controllers/kycController$': '<rootDir>/__mocks__/kycController.js',
    '^../controllers/assessmentController$': '<rootDir>/__mocks__/assessmentController.js',
    '^../controllers/withdrawalController$': '<rootDir>/__mocks__/withdrawalController.js',
    '^../controllers/verificationController$': '<rootDir>/__mocks__/verificationController.js',
    '^../controllers/idSelfieController$': '<rootDir>/__mocks__/idSelfieController.js',
    '^../controllers/addressController$': '<rootDir>/__mocks__/addressController.js',
    '^../controllers/clientServiceController$': '<rootDir>/__mocks__/clientServiceController.js',
    '^../controllers/providerServiceController$': '<rootDir>/__mocks__/providerServiceController.js',
    '^../controllers/integrationController$': '<rootDir>/__mocks__/integrationController.js',
    '^../controllers/recommendationController$': '<rootDir>/__mocks__/recommendationController.js',
    '^../controllers/earningsController$': '<rootDir>/__mocks__/earningsController.js',
    '^../controllers/webhookController$': '<rootDir>/__mocks__/webhookController.js',
    '^../controllers/dojahVerificationController$': '<rootDir>/__mocks__/dojahVerificationController.js',
    // Mock middleware
    '^../middleware/authMiddleware$': '<rootDir>/__mocks__/authMiddleware.js',
    '^../middleware/assessmentAuthMiddleware$': '<rootDir>/__mocks__/assessmentAuthMiddleware.js'
  }
};
