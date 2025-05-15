// src/controllers/authController.js
const axios = require('axios');
const { configDotenv } = require('dotenv');
const { protectUser } = require('../middleware/authMiddleware');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

// Verify if a user exists by making a request to the external API
const verifyUser = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and token are required for verification.'
      });
    }

    // Use protect middleware for verification
    const verifiedUser = await protectUser(userId, token);

    if (!verifiedUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Verification denied. You are not a logged-in user.'
      });
    }

    // If verification is successful
    res.status(200).json({
      status: 'success',
      message: 'User exists and can proceed with verification',
      user: verifiedUser
    });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during user verification',
      error: error.message
    });
  }
};

// Update user verification status in the external API
const updateUserVerificationStatus = async (userId, status, verificationData = {}) => {
  try {
    const response = await axios.put(`${External_API}/CareGivers/UpdateCaregiverInfo/${userId}`, {
      verificationStatus: status,
      verificationData: verificationData
    });
    
    return response.data;
  } catch (error) {
    console.error('Update verification status error:', error.message);
    throw new Error('Failed to update user verification status');
  }
};

module.exports = { verifyUser, updateUserVerificationStatus };
