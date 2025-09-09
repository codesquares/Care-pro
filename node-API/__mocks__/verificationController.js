// Mock verificationController
const verifyNIN = jest.fn((req, res) => {
  const { nin, userId } = req.body;
  
  if (!nin || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: nin, userId'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: 'nin_12345',
    result: 'verified',
    message: 'NIN verification completed successfully'
  });
});

const verifyBVN = jest.fn((req, res) => {
  const { bvn, userId } = req.body;
  
  if (!bvn || !userId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: bvn, userId'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: 'bvn_12345',
    result: 'verified',
    message: 'BVN verification completed successfully'
  });
});

const getVerificationStatus = jest.fn((req, res) => {
  const { verificationId } = req.params;
  
  if (!verificationId) {
    return res.status(400).json({
      status: 'error',
      message: 'Verification ID is required'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: verificationId,
    verificationStatus: 'completed',
    result: 'verified'
  });
});

const verifyBVNWithIdSelfie = jest.fn((req, res) => {
  const { bvn, userId, idDocument, selfieImage } = req.body;
  
  if (!bvn || !userId || !idDocument || !selfieImage) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: bvn, userId, idDocument, selfieImage'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: 'bvn_selfie_12345',
    result: {
      bvnVerified: true,
      idVerified: true,
      selfieMatched: true
    },
    message: 'BVN with ID and selfie verification completed'
  });
});

const verifyNINWithSelfie = jest.fn((req, res) => {
  const { nin, userId, selfieImage } = req.body;
  
  if (!nin || !userId || !selfieImage) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: nin, userId, selfieImage'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: 'nin_selfie_12345',
    result: {
      ninVerified: true,
      selfieMatched: true
    },
    message: 'NIN with selfie verification completed'
  });
});

const verifyBVNWithSelfieOnly = jest.fn((req, res) => {
  const { bvn, userId, selfieImage } = req.body;
  
  if (!bvn || !userId || !selfieImage) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: bvn, userId, selfieImage'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    verificationId: 'bvn_selfie_only_12345',
    result: {
      bvnVerified: true,
      selfieMatched: true
    },
    message: 'BVN with selfie-only verification completed'
  });
});

const createVerificationSession = jest.fn((req, res) => {
  const { userId, verificationType } = req.body;
  
  if (!userId || !verificationType) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: userId, verificationType'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    sessionId: 'session_12345',
    message: 'Verification session created successfully'
  });
});

module.exports = {
  verifyNIN,
  verifyBVN,
  getVerificationStatus,
  verifyBVNWithIdSelfie,
  verifyNINWithSelfie,
  verifyBVNWithSelfieOnly,
  createVerificationSession
};
