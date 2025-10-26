// Mock idSelfieController
const verifyIdWithSelfie = jest.fn((req, res) => {
  const { userId, idDocument, selfieImage } = req.body;
  
  // Validate required fields
  if (!userId || !idDocument || !selfieImage) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: userId, idDocument, selfieImage'
    });
  }
  
  // Simulate ID and selfie verification
  return res.status(200).json({
    status: 'success',
    verificationId: 'id_selfie_12345',
    result: {
      idVerified: true,
      selfieMatched: true,
      confidence: 0.95
    },
    message: 'ID and selfie verification completed successfully'
  });
});

// Export the main verification function as default export
module.exports = verifyIdWithSelfie;
