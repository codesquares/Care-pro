import '@testing-library/jest-dom';

// Mock import.meta for Jest
global.importMeta = {
  env: {
    VITE_API_URL: 'http://localhost:3000/api',
    VITE_AZURE_API_URL: 'http://localhost:3000/api',
    VITE_LOCAL_API_URL: 'http://localhost:3000/api',
    VITE_DOJAH_APP_ID: 'test-app-id',
    VITE_DOJAH_WIDGET_ID: 'test-widget-id',
    VITE_DOJAH_PUBLIC_KEY: 'test-public-key',
    VITE_DEBUG: 'true',
    MODE: 'test'
  }
};

// Add TextEncoder/TextDecoder for MSW
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add BroadcastChannel polyfill for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Polyfill fetch for tests (required by MSW)
require('whatwg-fetch');

// Mock localStorage to work with real localStorage operations
const realLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((i) => {
      const keys = Object.keys(store);
      return keys[i] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: realLocalStorage,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock console to reduce noise in tests
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};
