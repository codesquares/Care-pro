/**
 * Simple test script to verify that Express can handle large payloads after our fix.
 */
const axios = require('axios');

// Base URL for the API
const API_URL = 'http://localhost:3000';

// Function to create a large string
function createLargeObject(sizeMB) {
  // Calculate the approximate number of characters for the desired size in MB
  const sizeInBytes = sizeMB * 1024 * 1024;
  const length = Math.floor(sizeInBytes / 2); // Each character is ~2 bytes
  
  // Create a large string
  let largeString = '';
  const chunk = 'x'.repeat(1000);
  
  while (largeString.length < length) {
    largeString += chunk;
  }
  
  return {
    testData: largeString,
    timestamp: new Date().toISOString()
  };
}

// Test if the server can handle large payloads
async function testLargePayload() {
  try {
    // Create a large payload (20MB)
    const sizeMB = 20;
    const payload = createLargeObject(sizeMB);
    
    console.log(`Created payload of approximately ${sizeMB}MB`);
    console.log(`Actual size: ~${Math.round((JSON.stringify(payload).length / (1024 * 1024)) * 100) / 100}MB`);
    
    console.log('Sending request to server...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${API_URL}/test-payload`,
      payload,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 seconds timeout for large payload
      }
    );
    
    const endTime = Date.now();
    console.log(`✅ Success! Server handled ${sizeMB}MB payload in ${(endTime - startTime)/1000} seconds`);
    console.log('Response status:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Error testing large payload:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      
      if (error.response.status === 413) {
        console.error('⚠️ FAILED: Server returned "Payload Too Large" error (HTTP 413)');
        console.error('The fix for increasing payload size limit is not working!');
      } else {
        console.error('Response data:', error.response.data);
      }
    }
    return false;
  }
}

// Run the test
async function run() {
  console.log('🧪 Testing if the server can handle large payloads after our fix');
  
  try {
    const result = await testLargePayload();
    
    if (result) {
      console.log('✅ Test passed! Server can now handle large payloads.');
    } else {
      console.error('❌ Test failed. Server rejected the large payload.');
    }
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
