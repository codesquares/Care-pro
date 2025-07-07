// Implement verification controllers for the KYC process
const DojahService = require('../services/dojahService');
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

// Define test values for automatic verification
const TEST_VALUES = {
  BVN: '22222222222',
  NIN: '70123456789'
};

// Verify NIN with or without selfie
const verifyNIN = async (req, res) => {
  try {
    const { ninNumber, selfieImage, isWithSelfie, userType, token, id } = req.body;
    const userId = req.user.id;

    // Check if userId from request matches the authenticated user
    if (id && id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to verify NIN for another user'
      });
    }

    // Validate inputs
    if (!ninNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'NIN number is required'
      });
    }
   // check for token
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authorization token is required'
      });
    }
    if (isWithSelfie === true && !selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Selfie image is required for NIN+selfie verification'
      });
    }

    const isTestNin = ninNumber === TEST_VALUES.NIN;
    let verificationResult;

    if (isTestNin) {
      console.log(`🧪 Test NIN detected: ${ninNumber} - Auto-approving verification`);

      verificationResult = {
        status: true,
        entity: {
          nin: ninNumber,
          first_name: req.user.firstName || "Test",
          last_name: req.user.lastName || "User",
          middle_name: "",
          gender: "M",
          date_of_birth: "1990-01-01",
          phone_number: "0800000000",
          selfie_verification: selfieImage ? {
            confidence_value: 99.9,
            match: true
          } : undefined,
          verification_status: "success",
          verified: true
        },
        isTestValue: true
      };
    } else {
      verificationResult = await DojahService.verifyNIN(ninNumber, selfieImage, userId);
    }

    // Check if verification was successful
    if (
      verificationResult.status === true &&
      verificationResult.entity &&
      (
        verificationResult.entity.verified === true ||
        (
          selfieImage &&
          verificationResult.entity.selfie_verification &&
          verificationResult.entity.selfie_verification.match === true
        )
      )
    ) {
      let verificationType = 'nin';
      if (selfieImage) {
        verificationType = 'nin_selfie';
      }

      const verificationData = {
        userId: userId,
        verifiedFirstName: verificationResult.entity.first_name,
        verifiedLastName: verificationResult.entity.last_name,
        verificationMethod: verificationType,
        verificationNo: ninNumber,
        verificationStatus: 'verified',
      };

      try {
        if (!verificationResult.isTestValue) {
          const apiEndpoint = userType === 'client'
            ? `${External_API}/Verifications`
            : `${External_API}/Verifications`;

          console.log('Sending NIN verification result to backend database');
          await axios.post(apiEndpoint, verificationData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('Test NIN value detected. Skipping database update.');
        }
      } catch (apiError) {
        console.error('Failed to update verification status in Azure API:', apiError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'NIN verification successful',
        data: {
          verified: true,
          verificationStatus: 'verified',
          nin: ninNumber,
          withSelfie: !!selfieImage,
          firstName: verificationResult.entity.first_name,
          lastName: verificationResult.entity.last_name,
          gender: verificationResult.entity.gender,
          dateOfBirth: verificationResult.entity.date_of_birth,
          nextSteps: !selfieImage ? ['selfie'] : []
        }
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: verificationResult.entity?.message || 'NIN verification failed',
        data: {
          verified: false,
          verificationStatus: 'failed',
          nin: ninNumber,
          error: verificationResult.entity?.message || 'Verification failed. Please check your information and try again.'
        }
      });
    }
  } catch (error) {
    console.error('NIN verification controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during NIN verification',
      error: error.message
    });
  }
};


const verifyBVN = async (req, res) => {
  try {
    const { bvnNumber, selfieImage, isWithSelfie, token, userType, id } = req.body;
    const userId = req.user.id;

    // Check if userId from request matches the authenticated user
    if (id && id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to verify BVN for another user'
      });
    }

    // Validate inputs
    if (!bvnNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN number is required'
      });
    }
    // check for token
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authorization token is required'
      });
    }

    if (isWithSelfie === true && !selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Selfie image is required for BVN+selfie verification'
      });
    }

    const isTestBvn = bvnNumber === TEST_VALUES.BVN;
    let verificationResult;

    if (isTestBvn) {
      console.log(`🧪 Test BVN detected: ${bvnNumber} - Auto-approving verification`);

      verificationResult = {
        status: true,
        entity: {
          bvn: bvnNumber,
          first_name: req.user.firstName || "Test",
          last_name: req.user.lastName || "User",
          middle_name: "",
          date_of_birth: "01-January-1990",
          phone_number1: "08100000000",
          gender: "Male",
          selfie_verification: selfieImage ? {
            confidence_value: 99.9,
            match: true
          } : undefined,
          verification_status: "success",
          verified: true
        },
        isTestValue: true
      };
    } else {
      verificationResult = await DojahService.verifyBVN(bvnNumber, selfieImage, userId);
    }

    // Check if verification was successful
    if (
      verificationResult.status === true &&
      verificationResult.entity &&
      (
        verificationResult.entity.verified === true ||
        (
          selfieImage &&
          verificationResult.entity.selfie_verification &&
          verificationResult.entity.selfie_verification.match === true
        )
      )
    ) {
      let verificationType = 'bvn';
      if (selfieImage) {
        verificationType = 'bvn_selfie';
      }

      const verificationData = {
        userId,
        verifiedFirstName: verificationResult.entity.first_name,
        verifiedLastName: verificationResult.entity.last_name,

        verificationStatus: 'verified',
        verificationMethod: verificationType,
        verificationNo: bvnNumber,
    
      };

      try {
        if (!verificationResult.isTestValue) {
          const apiEndpoint = userType === 'client'
            ? `${External_API}/Verifications`
            : `${External_API}/Verifications`;

          console.log('Sending BVN verification result to backend database');
          await axios.post(apiEndpoint, verificationData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('Test BVN value detected. Skipping database update.');
        }
      } catch (apiError) {
        console.error('Failed to update verification status in Azure API:', apiError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'BVN verification successful',
        data: {
          verified: true,
          verificationStatus: 'verified',
          bvn: bvnNumber,
          withSelfie: !!selfieImage,
          firstName: verificationResult.entity.first_name,
          lastName: verificationResult.entity.last_name,
          gender: verificationResult.entity.gender,
          dateOfBirth: verificationResult.entity.date_of_birth,
          nextSteps: !selfieImage ? ['selfie'] : []
        }
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: verificationResult.entity?.message || 'BVN verification failed',
        data: {
          verified: false,
          verificationStatus: 'failed',
          bvn: bvnNumber,
          error: verificationResult.entity?.message || 'Verification failed. Please check your information and try again.'
        }
      });
    }
  } catch (error) {
    console.error('BVN verification controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during BVN verification',
      error: error.message
    });
  }
};


const verifyBVNWithIdSelfie = async (req, res) => {
  try {
    const { bvnNumber, idImage, selfieImage, idType, userType, id, token } = req.body;
    const userId = req.user.id;
    // Check if userId from request matches the authenticated user
    if (id && id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to verify BVN for another user'
      });
    }

    // Validate inputs
    if (!bvnNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN number is required'
      });
    }

    if (!idImage || !selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Both ID image and selfie image are required for BVN with ID+Selfie verification'
      });
    }

    // Generate reference IDs for tracking
    const bvnReferenceId = `bvn_${userId}_${Date.now()}`;
    const idSelfieReferenceId = `id_selfie_${userId}_${Date.now()}`;

    // First verify BVN
    const bvnResult = await DojahService.verifyBVN(bvnNumber, null, userId, bvnReferenceId);

    if (!bvnResult.status || !bvnResult.entity || bvnResult.entity.verified !== true) {
      return res.status(400).json({
        status: 'error',
        message: bvnResult.entity?.message || 'BVN verification failed',
        data: {
          verified: false,
          verificationStatus: 'failed',
          bvn: bvnNumber,
          error: bvnResult.entity?.message || 'BVN verification failed. Please check your information and try again.'
        }
      });
    }

    // Proceed with ID+Selfie verification
    const idSelfieResult = await DojahService.verifyIdWithSelfie(
      selfieImage,
      idImage,
      idType,
      idSelfieReferenceId
    );

    const isIdSelfieVerified = idSelfieResult.status &&
      (idSelfieResult.entity?.verification_status === 'verified' ||
       idSelfieResult.entity?.verified === true);

    // Check if this is a test BVN value
    const isTestBvn = bvnNumber === TEST_VALUES.BVN;

    if (isIdSelfieVerified) {
      const verificationData = {
        userId,
        verifiedFirstName: bvnResult.entity.first_name,
        verifiedLastName: bvnResult.entity.last_name,
        verificationNo: bvnNumber,
        verificationStatus: 'verified',
        verificationMethod: 'bvn_id_selfie',
      };

      try {
        if (!isTestBvn) {
          const apiEndpoint = userType === 'client'
            ? `${External_API}/Verifications`
            : `${External_API}/Verifications`;

          console.log('Sending verification result to backend database');
          await axios.post(apiEndpoint, verificationData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('Test BVN value detected. Skipping database update.');
        }
      } catch (apiError) {
        console.error('Failed to update verification status in Azure API:', apiError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'BVN with ID and Selfie verification successful',
        data: {
          verified: true,
          verificationStatus: 'verified',
          bvn: bvnNumber,
          firstName: bvnResult.entity.first_name,
          lastName: bvnResult.entity.last_name,
          nextSteps: []
        },
        referenceIds: {
          bvn: bvnReferenceId,
          idSelfie: idSelfieReferenceId
        }
      });
    } else {
      // ID+Selfie verification pending webhook callback
      return res.status(200).json({
        status: 'pending',
        message: 'BVN verified successfully. ID and Selfie verification is processing.',
        data: {
          verified: false,
          verificationStatus: 'pending',
          bvn: bvnNumber,
          bvnStatus: 'verified',
          idSelfieStatus: 'pending',
          nextSteps: []
        },
        referenceIds: {
          bvn: bvnReferenceId,
          idSelfie: idSelfieReferenceId
        }
      });
    }
  } catch (error) {
    console.error('BVN with ID and Selfie verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during verification',
      error: error.message
    });
  }
};


// Combined NIN with Selfie verification
const verifyNINWithSelfie = async (req, res) => {
  try {
    const { ninNumber, selfieImage, id } = req.body;
     const userId = req.user.id;
    // Check if userId from request matches the authenticated user
    if (id && id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to verify NIN for another user'
      });
    }
   

    // Validate inputs
    if (!ninNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'NIN number is required'
      });
    }
    if (!selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Selfie image is required for NIN+Selfie verification'
      });
    }

    const referenceId = `nin_selfie_${userId}_${Date.now()}`;

    const verificationResult = await DojahService.verifyNIN(ninNumber, selfieImage, userId, referenceId);

    const isTestNin = ninNumber === TEST_VALUES.NIN;

    if (
      verificationResult.status === true &&
      verificationResult.entity &&
      verificationResult.entity.verified === true &&
      verificationResult.entity.selfie_verification &&
      verificationResult.entity.selfie_verification.match === true
    ) {
      const verificationData = {
        userId,
        verifiedFirstName: verificationResult.entity.first_name,
        verifiedLastName: verificationResult.entity.last_name,
        verificationStatus: 'verified',
        verificationMethod: "nin_selfie",
        verificationNo: ninNumber,
      };

      try {
        if (!isTestNin) {
          const apiEndpoint = userType === 'client'
            ? `${External_API}/Verifications`
            : `${External_API}/Verifications`;

          console.log('Sending verification result to backend database');
          await axios.post(apiEndpoint, verificationData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('Test NIN detected, skipping database update');
        }
      } catch (apiError) {
        console.error('Failed to update verification status in Azure API:', apiError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'NIN with Selfie verification successful',
        data: {
          verified: true,
          verificationStatus: 'verified',
          nin: ninNumber,
          firstName: verificationResult.entity.first_name,
          lastName: verificationResult.entity.last_name,
          nextSteps: []
        },
        referenceId
      });
    } else {
      const status = verificationResult.status ? 'pending' : 'failed';
      return res.status(status === 'failed' ? 400 : 200).json({
        status,
        message: verificationResult.entity?.message || `NIN with Selfie verification ${status}`,
        data: {
          verified: false,
          verificationStatus: status,
          nin: ninNumber,
          error: verificationResult.entity?.message || `Verification ${status}. Please check your information and try again.`
        },
        referenceId
      });
    }
  } catch (error) {
    console.error('NIN with Selfie verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during verification',
      error: error.message
    });
  }
};

// Verify ID with selfie in one combined step
const verifyIdWithSelfie = async (req, res) => {
  try {
    const { idType, idNumber, selfieImage, userType, id, token } = req.body;
    const userId = req.user.id;
    // Check if userId from request matches the authenticated user
    if (id && id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to verify ID for another user'
      });
    }

    if (!idType || !idNumber || !selfieImage) {
      return res.status(400).json({
        status: 'error',
        message: 'ID type, ID number, and selfie image are all required'
      });
    }

    if (idType !== 'bvn' || idType !== 'nin' || idType !== 'generic') {
      return res.status(400).json({
        status: 'error',
        message: 'ID type must be either "bvn", "nin", or "generic"'
      });
    }

    const verificationResult = await DojahService.verifyIdWithSelfie(idType, idNumber, selfieImage, userId);
    const isTestValue = (idType === 'nin' && idNumber === TEST_VALUES.NIN) || (idType === 'bvn' && idNumber === TEST_VALUES.BVN);

    if (
      verificationResult.status === true &&
      verificationResult.entity &&
      (
        verificationResult.entity.verified === true ||
        (verificationResult.entity.selfie_verification && verificationResult.entity.selfie_verification.match === true)
      )
    ) {
      const verificationData = {
        userId,
        verifiedFirstName: verificationResult.entity.first_name,
        verifiedLastName: verificationResult.entity.last_name,
        verificationNo: idNumber,
        verificationStatus: 'verified', 
    
        verificationMethod: idType,
        
      };

      try {
        if (!isTestValue) {
          const apiEndpoint = userType === 'client'
            ? `${External_API}/Verifications`
            : `${External_API}/Verifications`;

          console.log('Sending verification result to backend database');
          await axios.patch(apiEndpoint, verificationData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          console.log('Test value detected, skipping database update');
        }
      } catch (apiError) {
        console.error('Failed to update verification status in Azure API:', apiError);
      }

      return res.status(200).json({
        status: 'success',
        message: `${idType.toUpperCase()} with selfie verification successful`,
        data: {
          verified: true,
          verificationStatus: 'verified',
          idType,
          idNumber,
          firstName: verificationResult.entity.first_name,
          lastName: verificationResult.entity.last_name,
          gender: verificationResult.entity.gender,
          dateOfBirth: verificationResult.entity.date_of_birth,
          nextSteps: []
        }
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: verificationResult.entity?.message || `${idType.toUpperCase()} with selfie verification failed`,
        data: {
          verified: false,
          verificationStatus: 'failed',
          idType,
          idNumber,
          error: verificationResult.entity?.message || 'Verification failed. Please check your information and try again.'
        }
      });
    }
  } catch (error) {
    console.error('ID with selfie verification controller error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during ID with selfie verification',
      error: error.message
    });
  }
};


// Get the verification status for the current user
const getVerificationStatus = async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id;
    // Get the user type from query params
    const userType = req.query.userType || 'caregiver';
    //get the token from headers
    const token = req.headers.authorization?.split(' ')[1];
    
    // Get verification status from Azure API
    let verificationStatus;
    try {
      // Use different endpoints based on user type
      const endpoint = userType === 'client' 
        ? `${External_API}/Verifications/${userId}`
        : `${External_API}/Verifications/${userId}`;

      const response = await axios.get(
        endpoint,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      verificationStatus = response.data;
    } catch (apiError) {
      console.error('Failed to get verification status from Azure API:', apiError);
      // Fallback to default status if API call fails
      verificationStatus = {
        verified: false,
        verificationStatus: 'unverified',
        methods: {
          bvn: { status: 'not_verified' },
          nin: { status: 'not_verified' },
          idSelfie: { status: 'not_verified' }
        }
      };
    }
    
    // Check for verification in headers - for testing purposes
    const forcedVerification = req.headers['x-force-verification'];
    if (forcedVerification === 'true') {
      return res.status(200).json({
        status: 'success',
        data: {
          verified: true,
          verificationStatus: 'verified',
          ninVerified: true,
          bvnVerified: true,
          idVerified: true,
          selfieVerified: true,
          methods: {
            bvn: { status: 'verified', lastVerified: new Date().toISOString() },
            nin: { status: 'verified', lastVerified: new Date().toISOString() },
            idSelfie: { status: 'verified', lastVerified: new Date().toISOString() }
          },
          isComplete: true,
          message: 'Verification forced via header'
        }
      });
    }
    
    // Format the response based on the Azure API response or default status
    return res.status(200).json({
      status: 'success',
      data: {
        verified: verificationStatus.verified || false,
        verificationStatus: verificationStatus.verificationStatus || 'unverified',
        bvnVerified: verificationStatus.methods?.bvn?.status === 'verified' || false,
        ninVerified: verificationStatus.methods?.nin?.status === 'verified' || false,
        idVerified: verificationStatus.methods?.idSelfie?.status === 'verified' || false,
        selfieVerified: verificationStatus.methods?.selfie?.status === 'verified' || false,
        methods: verificationStatus.methods || {
          bvn: { status: 'not_verified' },
          nin: { status: 'not_verified' },
          idSelfie: { status: 'not_verified' }
        },
        isComplete: verificationStatus.isComplete || false,
        completedAt: verificationStatus.completedAt || null,
        message: verificationStatus.message || 'Verification status retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting verification status',
      error: error.message
    });
  }
};

module.exports = {
  verifyNIN,
  verifyBVN,
  verifyBVNWithIdSelfie,
  verifyNINWithSelfie,
  getVerificationStatus
};
