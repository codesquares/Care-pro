// This file contains tests for the verification system

const verifyBVNWithIdSelfie = async () => {
  console.log("Testing BVN + ID + Selfie verification...");
  
  try {
    // Mock API credentials for testing
    const testData = {
      // Test BVN from Dojah docs: 22222222222
      bvnNumber: '22222222222',
      
      // Base64 encoded sample images
      selfieImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      idImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      
      idType: 'nin',
      userType: 'client',
      userId: 'test-user-123'
    };
    
    // Test client with BVN + ID + Selfie verification
    const response = await fetch('http://localhost:3000/api/kyc/verify-bvn-with-id-selfie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log("BVN + ID + Selfie verification result:", result);
    
    return {
      success: response.ok && (result.status === 'success' || result.status === 'pending'),
      result
    };
  } catch (error) {
    console.error("BVN + ID + Selfie verification test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const verifyNINWithSelfie = async () => {
  console.log("Testing NIN + Selfie verification...");
  
  try {
    // Mock API credentials for testing
    const testData = {
      // Test NIN from Dojah docs: 70123456789
      ninNumber: '70123456789',
      
      // Base64 encoded sample image
      selfieImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      
      userType: 'client',
      userId: 'test-user-123'
    };
    
    // Test client with NIN + Selfie verification
    const response = await fetch('http://localhost:3000/api/kyc/verify-nin-with-selfie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log("NIN + Selfie verification result:", result);
    
    return {
      success: response.ok && (result.status === 'success' || result.status === 'pending'),
      result
    };
  } catch (error) {
    console.error("NIN + Selfie verification test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

const runAllTests = async () => {
  console.log("=== RUNNING VERIFICATION SYSTEM TESTS ===");
  
  // Test API health
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log("API Health:", healthData);
    
    if (!healthResponse.ok) {
      console.error("API health check failed. Make sure the server is running.");
      return;
    }
  } catch (error) {
    console.error("API health check failed:", error.message);
    console.log("Make sure the server is running at http://localhost:3000");
    return;
  }
  
  // Run all verification tests
  const bvnTestResult = await verifyBVNWithIdSelfie();
  const ninTestResult = await verifyNINWithSelfie();
  
  // Report results
  console.log("\n=== TEST RESULTS ===");
  console.log("BVN + ID + Selfie verification:", bvnTestResult.success ? "PASSED" : "FAILED");
  console.log("NIN + Selfie verification:", ninTestResult.success ? "PASSED" : "FAILED");
  
  // Overall success
  const allPassed = bvnTestResult.success && ninTestResult.success;
  console.log("\nOverall result:", allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
};

// Run the tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  verifyBVNWithIdSelfie,
  verifyNINWithSelfie,
  runAllTests
};
