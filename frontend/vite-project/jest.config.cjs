module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      useESM: false
    },
    importMeta: {
      env: {
        VITE_API_URL: 'https://oncarepro.com/api',
        VITE_AZURE_API_URL: 'https://oncarepro.com/api',
        VITE_LOCAL_API_URL: 'https://carepro-api-service-768822997.us-east-1.elb.amazonaws.com',
        VITE_MIDDLEWARE_API_URL: 'https://carepro-api-service-768822997.us-east-1.elb.amazonaws.com',
        MODE: 'test'
      }
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^../config$': '<rootDir>/__mocks__/config.js',
    '^.*config$': '<rootDir>/__mocks__/config.js'
  },
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/dist/',
    '__tests__/App.test.js',
    '__tests__/App-basic.test.js',
    '__tests__/App-simple.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/main.jsx'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(msw)/)'
  ]
};