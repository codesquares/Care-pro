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
    console.log("Withdrawal Response:", withdrawalResponse);
    return res.status(200).json({ message: "Withdrawal request submitted successfully." });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // If it's a CarePro API error (status 400) with a specific message, pass it through as 400
    if (error.response?.status === 400 && error.message && error.message !== 'Failed to generate withdrawal') {
      return res.status(400).json({ errorMessage: error.message });
    }
    
    // For all other errors (network, 500, etc.), return 500
    return res.status(500).json({ errorMessage: "Failed to process withdrawal request." });
  }
}

module.exports = {
  withdrawFunds
};