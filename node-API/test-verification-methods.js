/**
 * Test script to verify that our verification methods are working correctly.
 * This script tests the BVN, NIN, and ID & Selfie verification methods.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the verification API
const API_URL = 'http://localhost:3000/api';

// Sample test data (use test data for Dojah sandbox)
const TEST_DATA = {
  // Test BVN number for Dojah sandbox
  bvn: '22342748110',
  
  // Test NIN number for Dojah sandbox
  nin: '12345678909',
  
  // Sample base64 strings - in production you would use real images
  // These are just placeholder strings for testing
  idImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
  selfieImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
  
  // Test user for login
  loginUser: {
    email: 'test@example.com',
    password: 'password123'
  }
};

// Global variable to store auth token
let authToken = null;

// Function to login and get auth token
const getAuthToken = async () => {
  console.log('\n🔒 Getting Authentication Token...');
  try {
    // For this test, we'll use a mock token for testing purposes
    console.log('ℹ️ Using mock token for testing purposes');
    authToken = 'mock-token-for-testing';
    console.log('✅ Authentication successful with mock token');
    
    return authToken;
  } catch (error) {
    console.error('❌ Authentication Error:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Function to test BVN verification
const testBVNVerification = async () => {
  console.log('\n📝 Testing BVN Verification...');
  console.log('⏳ Starting verification process...');
  try {
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        process.stdout.write(`\r⏳ Verification in progress: ${progress}% complete`);
      }
    }, 500);

    const response = await axios.post(`${API_URL}/kyc/verify-bvn`, {
      bvnNumber: TEST_DATA.bvn
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    clearInterval(progressInterval);
    process.stdout.write(`\r⏳ Verification in progress: 100% complete\n`);
    
    console.log('✅ BVN Verification Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ BVN Verification Error:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Function to test NIN verification
const testNINVerification = async () => {
  console.log('\n📝 Testing NIN Verification...');
  console.log('⏳ Starting verification process...');
  try {
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        process.stdout.write(`\r⏳ Verification in progress: ${progress}% complete`);
      }
    }, 500);

    const response = await axios.post(`${API_URL}/kyc/verify-nin`, {
      ninNumber: TEST_DATA.nin
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    clearInterval(progressInterval);
    process.stdout.write(`\r⏳ Verification in progress: 100% complete\n`);
    
    console.log('✅ NIN Verification Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ NIN Verification Error:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Function to test ID & Selfie verification
const testIDSelfieVerification = async () => {
  console.log('\n📝 Testing ID & Selfie Verification...');
  console.log('⏳ Starting verification process...');
  try {
    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        process.stdout.write(`\r⏳ Verification in progress: ${progress}% complete`);
      }
    }, 500);

    const response = await axios.post(`${API_URL}/kyc/verify-id-selfie`, {
      idImage: TEST_DATA.idImage,
      selfieImage: TEST_DATA.selfieImage
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    clearInterval(progressInterval);
    process.stdout.write(`\r⏳ Verification in progress: 100% complete\n`);
    
    console.log('✅ ID & Selfie Verification Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ ID & Selfie Verification Error:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Main function to run tests
const runTests = async () => {
  console.log('🧪 Starting Verification Methods Tests');
  console.log('=====================================');
  
  // First, get a valid token
  await getAuthToken();
  
  // Test results
  const results = {
    bvn: null,
    nin: null,
    idSelfie: null
  };
  
  // Test each verification method
  results.bvn = await testBVNVerification();
  results.nin = await testNINVerification();
  results.idSelfie = await testIDSelfieVerification();
  
  console.log('\n=====================================');
  console.log('🏁 Verification Tests Completed');
  
  // Summary of results
  console.log('\n📊 Test Results Summary:');
  console.log('-------------------------------------');
  console.log(`BVN Verification: ${results.bvn ? '✅ Success' : '❌ Failed'}`);
  console.log(`NIN Verification: ${results.nin ? '✅ Success' : '❌ Failed'}`);
  console.log(`ID & Selfie Verification: ${results.idSelfie ? '✅ Success' : '❌ Failed'}`);
  console.log('-------------------------------------');
  
  return results;
};

// Run the tests
runTests().catch(error => {
  console.error('Fatal error during tests:', error);
  process.exit(1);
});
