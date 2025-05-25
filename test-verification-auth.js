/**
 * Test script to verify BVN and NIN authentication
 * 
 * This script can be used to test the authentication fixes implemented
 * in the verification system.
 * 
 * Usage:
 *   node test-verification-auth.js
 */

// Import required modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Constants
const API_URL = 'http://localhost:3000/api';
const TEST_BVN = '22222222222'; // Test BVN number
const TEST_NIN = '70123456789'; // Test NIN number
const TEST_USER_ID = '681121f4ae5bbc08d65246c4'; // Replace with a valid user ID
const TEST_USER_TYPE = 'caregiver'; // or 'client'

// Mock authentication token (replace with a valid token for testing)
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

// Create API client with auth
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

/**
 * Test BVN verification
 */
async function testBVNVerification() {
  try {
    console.log('Testing BVN verification...');
    
    const response = await apiClient.post('/kyc/verify-bvn', {
      bvnNumber: TEST_BVN,
      userId: TEST_USER_ID,
      userType: TEST_USER_TYPE
    });
    
    console.log('BVN verification successful:', response.data);
    return true;
  } catch (error) {
    console.error('BVN verification failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test NIN verification
 */
async function testNINVerification() {
  try {
    console.log('Testing NIN verification...');
    
    const response = await apiClient.post('/kyc/verify-nin', {
      ninNumber: TEST_NIN,
      userId: TEST_USER_ID,
      userType: TEST_USER_TYPE
    });
    
    console.log('NIN verification successful:', response.data);
    return true;
  } catch (error) {
    console.error('NIN verification failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test verification status
 */
async function testVerificationStatus() {
  try {
    console.log('Testing verification status...');
    
    const response = await apiClient.get('/kyc/status', {
      params: {
        userId: TEST_USER_ID,
        userType: TEST_USER_TYPE
      }
    });
    
    console.log('Verification status:', response.data);
    return true;
  } catch (error) {
    console.error('Verification status check failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('==== Verification Authentication Tests ====');
  console.log('API URL:', API_URL);
  console.log('Test User ID:', TEST_USER_ID);
  console.log('Test User Type:', TEST_USER_TYPE);
  console.log('======================================');
  
  // Run tests
  const statusResult = await testVerificationStatus();
  const bvnResult = await testBVNVerification();
  const ninResult = await testNINVerification();
  
  // Summary
  console.log('======================================');
  console.log('Test Results:');
  console.log('- Verification Status:', statusResult ? '✅ PASS' : '❌ FAIL');
  console.log('- BVN Verification:', bvnResult ? '✅ PASS' : '❌ FAIL');
  console.log('- NIN Verification:', ninResult ? '✅ PASS' : '❌ FAIL');
  console.log('======================================');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});
