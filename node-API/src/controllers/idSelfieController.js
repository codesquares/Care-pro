// Verify ID and Selfie method
const DojahService = require('../services/dojahService');

// Import Dojah service instance (already instantiated in the service file)
const dojahService = DojahService;

const verifyIdSelfie = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
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
      verified: verificationResult.entity?.verification_status === 'verified',
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
