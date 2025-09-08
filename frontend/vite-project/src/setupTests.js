import '@testing-library/jest-dom';

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
