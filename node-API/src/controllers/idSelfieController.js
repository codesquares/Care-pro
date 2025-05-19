// Verify ID and Selfie method
const DojahService = require('../services/dojahService');
// const UserModel = require('../models/userModel'); // Commented out as we don't have this model

// Import Dojah service instance (already instantiated in the service file)
const dojahService = DojahService;

const verifyIdSelfie = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user.id;
    const { idImage, selfieImage } = req.body;
    
    if (!idImage || !selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Both ID image and selfie image are required'
      });
    }
    
    // Call Dojah service to verify the ID and selfie
    const verificationResult = await dojahService.verifySelfieToDocs(selfieImage, idImage);
    
    // Create verification response object based on the actual result
    const verification = {
      userId: userId,
      verificationType: 'id_selfie',
      status: verificationResult.entity?.verification_status || 'failed',
      verificationData: verificationResult.entity,
      verificationDate: new Date(),
      confidence: verificationResult.entity?.confidence || 0
    };
    
    // If verification is successful, update user verification status
    if (verificationResult.status && 
        verificationResult.entity?.verification_status === 'verified' || 
        verificationResult.entity?.verified === true) {
      
      // Database update removed as we don't use UserModel
      /*
      try {
        // Update user's verification status in the database
        await UserModel.findByIdAndUpdate(userId, {
          'verification.idVerified': true,
          'verification.status': 'verified'
        });
      } catch (dbError) {
        console.error('Error updating user verification status:', dbError);
        // Continue despite DB error as the verification itself was successful
      }
      */
    }
    
    // If there was an API or server error
    if (verificationResult.error) {
      return res.status(200).json({
        status: 'error',
        verified: false,
        message: verificationResult.entity?.message || 'Verification service error',
        data: verification
      });
    }
    
    // Return success or failure based on actual result
    res.status(200).json({
      status: verificationResult.status ? 'success' : 'failed',
      verified: verificationResult.entity?.verification_status === 'verified' || 
               verificationResult.entity?.verified === true,
      message: verificationResult.entity?.message,
      data: verification
    });
  } catch (error) {
    console.error('ID and Selfie verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during ID and Selfie verification'
    });
  }
};

module.exports = verifyIdSelfie;
