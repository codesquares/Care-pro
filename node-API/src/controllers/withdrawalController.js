const {generateWithdrawalRequest} = require('../services/withdrawalService');

const withdrawFunds = async (req, res) => {
  console.log("Withdrawal Request Body:", req.body);
  console.log("=== CONTROLLER DEBUG: Starting field extraction ===");
  const { amountRequested,
  accountNumber,
  bankName,
  accountName, caregiverId} = req.body;
  
  // Extract token from Authorization header like other endpoints
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errorMessage: "Authorization token is required." });
  }
  const token = authHeader.split(' ')[1];
  
  // More detailed logging for debugging
  console.log("Received fields:");
  console.log("- amountRequested:", amountRequested, typeof amountRequested);
  console.log("- caregiverId:", caregiverId, typeof caregiverId);
  console.log("- accountNumber:", accountNumber, typeof accountNumber);
  console.log("- bankName:", bankName, typeof bankName);
  console.log("- accountName:", accountName, typeof accountName);
  
  if (!amountRequested || !caregiverId || !accountNumber || !bankName || !accountName) {
    const missingFields = [];
    if (!amountRequested) missingFields.push('amountRequested');
    if (!caregiverId) missingFields.push('caregiverId');
    if (!accountNumber) missingFields.push('accountNumber');
    if (!bankName) missingFields.push('bankName');
    if (!accountName) missingFields.push('accountName');
    
    console.log("Missing fields:", missingFields);
    return res.status(400).json({ 
      errorMessage: "All fields are required.",
      missingFields: missingFields
    });
  }
  
  console.log("=== VALIDATION PASSED - Proceeding to withdrawal service ===");
  try {
    console.log("=== CALLING generateWithdrawalRequest service ===");
    const withdrawalResponse = await generateWithdrawalRequest({
      caregiverId: caregiverId,
      amountRequested: amountRequested,
      accountNumber: accountNumber,
      bankName: bankName,
      accountName: accountName,
      token: token
    });
    
    console.log("=== CONTROLLER: Service Response ===");
    console.log("Withdrawal Response:", withdrawalResponse);
    
    // Check if the service indicates success
    if (withdrawalResponse.success) {
      console.log("✅ Withdrawal request completed successfully");
      return res.status(200).json({ 
        message: "Withdrawal request submitted successfully.",
        data: withdrawalResponse.data,
        status: "success"
      });
    } else {
      console.log("⚠️ Service did not indicate success");
      return res.status(500).json({ 
        errorMessage: "Withdrawal service did not confirm success" 
      });
    }
    
  } catch (error) {
    console.error("=== CONTROLLER ERROR HANDLING ===");
    console.error("Error processing withdrawal:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error has status?", !!error.status);
    console.error("Error has responseData?", !!error.responseData);
    
    // Handle different types of errors
    if (error.status) {
      // Error from the C# API with specific status code
      console.log(`Returning ${error.status} error from C# API`);
      
      if (error.status >= 400 && error.status < 500) {
        // Client errors (400-499) - pass through as-is
        return res.status(error.status).json({ 
          errorMessage: error.message,
          details: error.responseData 
        });
      } else {
        // Server errors (500+) - return as 500
        return res.status(500).json({ 
          errorMessage: "Server error occurred while processing withdrawal request",
          details: error.message 
        });
      }
    } else {
      // Network or other errors - return as 500
      console.log("Network or other error - returning 500");
      return res.status(500).json({ 
        errorMessage: error.message || "Failed to process withdrawal request." 
      });
    }
  }
}

module.exports = {
  withdrawFunds
};