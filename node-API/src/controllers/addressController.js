// Address verification controller
const DojahService = require('../services/dojahService');
// const UserModel = require('../models/userModel'); // Commented out as we don't have this model

// Verify address
const verifyAddress = async (req, res) => {
  try {
    // Get address data from request body
    const addressData = req.body;
    
    // Get the user ID from the authenticated user
    const userId = req.user.id;
    
    // Validate inputs
    if (!addressData || !addressData.street) {
      return res.status(400).json({
        status: 'error',
        message: 'Address information is required'
      });
    }
    
    // Call the Dojah service to verify the address
    const verificationResult = await DojahService.verifyAddress(addressData);
    
    // Check if verification was successful
    if (verificationResult.status === true && verificationResult.entity) {
      // Update user's verification status in the database if needed
      /*
      try {
        await UserModel.findByIdAndUpdate(userId, {
          'verification.addressVerified': true,
          'verification.address': addressData,
          // Only update status if other verifications are also completed
          $set: { 'verification.status': 'verified' }
        });
      } catch (dbError) {
        console.error('Error updating user verification status:', dbError);
        // We continue despite DB error as the verification itself was successful
      }
      */
      
      // Return successful verification response
      return res.status(200).json({
        status: 'success',
        message: 'Address verification successful',
        data: {
          verified: true,
          verificationStatus: 'verified',
          address: addressData
        }
      });
    } else {
      // Verification failed
      return res.status(400).json({
        status: 'error',
        message: verificationResult.entity?.message || 'Address verification failed',
        data: {
          verified: false,
          verificationStatus: 'failed',
          address: addressData
        }
      });
    }
  } catch (error) {
    console.error('Address verification controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during address verification',
      error: error.message
    });
  }
};

module.exports = verifyAddress;
