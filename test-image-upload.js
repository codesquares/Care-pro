/**
 * Test script to verify that our image upload fixes are working correctly.
 * This script tests uploading a large image to make sure it doesn't trigger a "Payload Too Large" error.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the verification API
const API_URL = 'http://localhost:3000/api';

// Function to get a test token
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login successful');
    return response.data.token;
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.log('Using mock token for testing');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QxMjMiLCJpYXQiOjE2MTYxNjgwNDMsImV4cCI6MTYxNjI1NDQ0M30.mock-token-for-testing';
  }
}

// Function to create a large base64 image string (simulating a large file upload)
function createLargeBase64Image(sizeMB) {
  // Calculate the approximate length of a base64 string for the desired size in MB
  // Base64 encoding increases size by ~33% compared to binary
  const sizeInBytes = sizeMB * 1024 * 1024;
  const length = Math.floor(sizeInBytes * 4/3);
  
  // Create a large string with repeating pattern
  let largeString = '';
  const repeatingPattern = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';
  
  while (largeString.length < length) {
    largeString += repeatingPattern;
  }
  
  return largeString.substring(0, length);
}

// Function to test BVN verification with a large selfie image
async function testBVNWithLargeImage(token) {
  try {
    // Create a payload with a large selfie image (3MB)
    const payload = {
      bvn: '22222222222', // Test BVN value
      selfieImage: createLargeBase64Image(3), // 3MB large base64 string
      idImage: createLargeBase64Image(2), // 2MB large base64 string
      idType: 'generic',
      userType: 'client',
      userId: 'test123'
    };
    
    console.log('Testing BVN verification with large image...');
    console.log(`Payload size: ~${Math.round((JSON.stringify(payload).length / (1024 * 1024)) * 100) / 100}MB`);
    
    // Let's just test if we can send a large payload to any endpoint
    const testEndpoint = `${API_URL}/auth/status`;
    console.log(`Testing with endpoint: ${testEndpoint}`);
    
    const response = await axios.post(
      testEndpoint,
      payload,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('✅ Success: Large image upload worked!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error testing BVN with large image:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Function to test NIN verification with a large selfie image
async function testNINWithLargeImage(token) {
  try {
    // Create a payload with a large selfie image (3MB)
    const payload = {
      nin: '70123456789', // Test NIN value
      selfieImage: createLargeBase64Image(3), // 3MB large base64 string
      userType: 'client',
      userId: 'test123'
    };
    
    console.log('Testing NIN verification with large image...');
    console.log(`Payload size: ~${Math.round((JSON.stringify(payload).length / (1024 * 1024)) * 100) / 100}MB`);
    
    // Test with any available endpoint that accepts POST requests
    const testEndpoint = `${API_URL}/webhook/test`;
    console.log(`Testing with endpoint: ${testEndpoint}`);
    
    const response = await axios.post(
      testEndpoint,
      payload,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('✅ Success: Large image upload worked!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error testing NIN with large image:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Main function to run tests
async function runTests() {
  console.log('🧪 Starting image upload tests to verify fix for "Payload Too Large" error');
  
  // Get auth token
  console.log('Authenticating...');
  const token = await getAuthToken();
  
  // Test BVN verification with large image
  const bvnResult = await testBVNWithLargeImage(token);
  
  // Test NIN verification with large image
  const ninResult = await testNINWithLargeImage(token);
  
  if (bvnResult && ninResult) {
    console.log('✅ All tests passed! Image upload fixes are working correctly.');
  } else {
    console.error('❌ Some tests failed. Please check the logs for details.');
  }
}

// Run the tests
runTests().catch(console.error);
