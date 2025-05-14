const User = require('../models/userModel');
const VerificationModel = require('../models/verificationModel');
const ProviderService = require('../models/providerServiceModel');

/**
 * Gets user verification status for the Azure API
 * This endpoint allows the external Azure API to check a user's
 * verification status and results
 */
const getUserVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }
    
    // Get verification status from verification model
    const verificationStatus = await VerificationModel.find({ user: userId })
      .sort({ updatedAt: -1 }) // Get the most recent verifications first
      .lean();
    
    // Get assessment results 
    const assessmentResults = await User.findById(userId)
      .select('assessments assessmentScore verificationStatus')
      .lean();
    
    // Get provider service profile if available
    const providerProfile = await ProviderService.findOne({ provider: userId })
      .select('-createdAt -updatedAt -__v')
      .lean();
    
    // Compile verification summary
    const verificationSummary = {
      userId,
      identityVerified: false,
      assessmentPassed: false,
      providerProfileComplete: false,
      overallStatus: 'unverified',
      details: {}
    };
    
    // Update with identity verification status
    if (verificationStatus && verificationStatus.length > 0) {
      const latestVerification = verificationStatus[0];
      verificationSummary.identityVerified = latestVerification.status === 'verified';
      verificationSummary.details.verification = {
        status: latestVerification.status,
        verificationType: latestVerification.type,
        verifiedAt: latestVerification.updatedAt
      };
    }
    
    // Update with assessment status
    if (assessmentResults && assessmentResults.assessmentScore) {
      verificationSummary.assessmentPassed = assessmentResults.assessmentScore >= 50;
      verificationSummary.details.assessment = {
        score: assessmentResults.assessmentScore,
        passed: assessmentResults.assessmentScore >= 50,
        completedAt: assessmentResults.assessments ? 
          assessmentResults.assessments[0]?.completedAt : null
      };
    }
    
    // Update with provider profile status
    if (providerProfile) {
      verificationSummary.providerProfileComplete = true;
      verificationSummary.details.providerProfile = {
        providerType: providerProfile.providerType,
        serviceTypes: providerProfile.serviceTypes,
        averageRating: providerProfile.averageRating,
        active: providerProfile.active,
        reviewCount: providerProfile.reviews ? providerProfile.reviews.length : 0
      };
    }
    
    // Determine overall verification status
    if (verificationSummary.identityVerified && verificationSummary.assessmentPassed) {
      verificationSummary.overallStatus = 'verified';
      
      // If provider profile isn't complete but everything else is
      if (!verificationSummary.providerProfileComplete) {
        verificationSummary.overallStatus = 'partial';
      }
    } else if (verificationSummary.identityVerified || verificationSummary.assessmentPassed) {
      verificationSummary.overallStatus = 'partial';
    }
    
    return res.status(200).json({
      status: 'success',
      data: verificationSummary
    });
    
  } catch (error) {
    console.error('Error getting user verification status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user verification status',
      error: error.message
    });
  }
};

/**
 * Synchronizes verification status with Azure API
 * This runs as a webhook when verification status changes
 */
const syncVerificationStatus = async (req, res) => {
  try {
    const { userId, verificationStatus } = req.body;
    
    if (!userId || !verificationStatus) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and verification status are required'
      });
    }
    
    // If Azure API endpoint is configured, send status update
    if (process.env.AZURE_API_ENDPOINT) {
      try {
        await axios.post(
          `${process.env.AZURE_API_ENDPOINT}/api/users/${userId}/verification-update`, 
          {
            verificationStatus,
            updatedAt: new Date(),
            source: 'node-api'
          },
          {
            headers: {
              'Authorization': `ApiKey ${process.env.AZURE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`Verification status synced with Azure API for user ${userId}`);
      } catch (syncError) {
        console.error('Failed to sync with Azure API:', syncError);
        // Don't return error response, as we still want to update our local status
      }
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Verification status synced successfully'
    });
    
  } catch (error) {
    console.error('Error syncing verification status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync verification status',
      error: error.message
    });
  }
};

module.exports = {
  getUserVerificationStatus,
  syncVerificationStatus
};
