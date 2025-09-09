// Test setup and configuration
// const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.API_URL = 'https://test-api.example.com/api';
  process.env.DOJAH_API_KEY = 'test-dojah-api-key';
  process.env.DOJAH_APP_ID = 'test-dojah-app-id';
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS = '10';
  
  // Mock console methods for cleaner test output
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
}, 30000);

// Global test teardown
afterAll(async () => {
  // Restore console methods
  Object.assign(console, originalConsole);
  
  // Close any open database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}, 30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper function to create mock request object
global.createMockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});

// Helper function to create mock response object
global.createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// Helper function to create mock next function
global.createMockNext = () => jest.fn();

// Mock axios globally
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock fs operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));
