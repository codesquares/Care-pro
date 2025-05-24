// Test script for the verification system API
// This script will test the verification status endpoint with both user types

const axios = require('axios');

// Set up test configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || 'your_test_token_here';

// Test data
const testCases = [
  {
    name: 'Caregiver Verification Status',
    endpoint: '/kyc/status',
    method: 'get',
    params: {
      userType: 'caregiver',
      userId: '12345'
    },
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  },
  {
    name: 'Client Verification Status',
    endpoint: '/kyc/status',
    method: 'get',
    params: {
      userType: 'client',
      userId: '67890'
    },
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  },
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'get',
    headers: {}
  }
];

// Run the tests
async function runTests() {
  console.log('=== Verification System API Tests ===');
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log('');
  
  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log(`Endpoint: ${test.method.toUpperCase()} ${API_BASE_URL}${test.endpoint}`);
    
    try {
      const response = await axios({
        method: test.method,
        url: `${API_BASE_URL}${test.endpoint}`,
        params: test.params,
        headers: test.headers,
        timeout: 5000 // 5 second timeout
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('✅ Test passed');
    } catch (error) {
      console.log(`❌ Test failed`);
      console.log(`Status: ${error.response?.status || 'Unknown'}`);
      console.log('Error details:');
      if (error.response) {
        console.log(JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(error.message);
      }
    }
    
    console.log('-----------------------------------');
  }
  
  console.log('All tests completed!');
}

// Run the tests
runTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
