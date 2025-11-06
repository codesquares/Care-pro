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
        VITE_PRODUCTION_API_URL: 'https://api.oncarepro.com/api',
        VITE_STAGING_API_URL: 'https://carepro-api20241118153443.azurewebsites.net/api',
        VITE_LOCAL_API_URL: 'http://localhost:5005/api',
        VITE_CONTENTFUL_SPACE_ID: 'test-space-id',
        VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED: 'test-published-token',
        VITE_CONTENTFUL_ACCESS_TOKEN_DRAFT: 'test-draft-token',
        VITE_DOJAH_APP_ID: 'test-app-id',
        VITE_DOJAH_WIDGET_ID: 'test-widget-id',
        VITE_DOJAH_PUBLIC_KEY: 'test-public-key',
        VITE_DEBUG: 'true',
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