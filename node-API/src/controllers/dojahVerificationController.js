const axios = require('axios');
const crypto = require('crypto');
// const config = require('../config');
const dotenv = require('dotenv');

// Verify Dojah webhook signature
const verifySignature = (signature, body) => {
  const hash = crypto
    .createHmac('sha256', process.env.DOJAH_API_KEY)
    .update(JSON.stringify(body))
    .digest('hex');
  return hash === signature;
};

// Format verification data for Azure
const formatVerificationData = (dojahData, userId) => {
  let verificationNo = '';
  let verificationMethod = '';

  // Extract verification number based on the type
  if (dojahData.bvn) {
    verificationNo = dojahData.bvn;
    verificationMethod = 'BVN';
  } else if (dojahData.nin) {
    verificationNo = dojahData.nin;
    verificationMethod = 'NIN';
  } else if (dojahData.id_number) {
    verificationNo = dojahData.id_number;
    verificationMethod = dojahData.id_type || 'ID';
  }

  return {
    userId,
    verifiedFirstName: dojahData.first_name,
    verifiedLastName: dojahData.last_name,
    verificationMethod,
    verificationNo,
    verificationStatus: dojahData.status === 'success' ? 'verified' : 'failed'
  };
};

// Handle Dojah webhook
const handleDojahWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-dojah-signature'];
    
    // Verify webhook signature
    if (!verifySignature(signature, req.body)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data, metadata } = req.body;
    console.log('Received webhook:', { event, metadata });

    if (event === 'verification.completed') {
      const userId = metadata?.user_id;
      if (!userId) {
        console.error('No user ID in webhook metadata');
        return res.status(400).json({ error: 'Missing user ID' });
      }

      // Format data for Azure
      const verificationData = formatVerificationData(data, userId);
      console.log('Formatted verification data:', verificationData);

      // Send to Azure backend
      const response = await axios.post(
        `${process.env.API_URL}/Verifications`,
        verificationData,
        {
          headers: {
            'Authorization': `Bearer ${req.headers.authorization}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Azure API response:', response.data);
      return res.status(200).json({ status: 'success' });
    }

    // Handle other webhook events
    return res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.response?.data || error.message 
    });
  }
};

// Handle Dojah webhook GET request
const handleGetDojahWebhook = (req, res) => {
  // This endpoint is for testing purposes, to verify if the webhook is reachable
  res.status(200).json({ status: 'Dojah webhook is reachable' });
};
// Save verification data (called from frontend)
const saveVerificationData = async (req, res) => {
  try {
    const { userId, verificationData } = req.body;

    if (!userId || !verificationData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Format data for Azure
    const formattedData = formatVerificationData(verificationData, userId);

    // Send to Azure backend
    const response = await axios.post(
      `${process.env.AZURE_API_URL}/api/Verifications`,
      formattedData,
      {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Save verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to save verification data',
      details: error.response?.data || error.message 
    });
  }
};

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const { userId, userType, token } = req.query;

    if (!userId || !userType || !token) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, userType, and token are required parameters' 
      });
    }

    // Here we're checking the verification status directly from our Node API
    // We can either query the Azure API or check our local database
    
    // For now, since we don't have a local database setup for verification,
    // we'll check if the user has been verified by querying the Azure API
    try {
      // Get verification status from Azure API
      const apiEndpoint = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
      console.log(`Checking verification status from Azure API: ${apiEndpoint}`);

      const response = await axios.get(`${apiEndpoint}/Verifications/userId?userId=${userId}`, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      //if response.code === 400 and response.message is "User with ID 'userId' has not been verified."
      if (response.data.code === 400 && response.data.message.includes(`User with ID '${userId}' has not been verified.`)) {
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: false,
            verificationStatus: 'not_verified',
            message: 'User has not completed verification'
          }
        });
      }
      // If we get a successful response with verification data
      if (response.data && response.data.id) {
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: true,
            verificationStatus: 'verified',
            verificationDetails: response.data
          }
        });
      } else {
        // User exists but is not verified
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: false,
            verificationStatus: 'not_verified',
            message: 'User has not completed verification'
          }
        });
      }
    } catch (error) {
      console.log('Error checking verification status:', error.message);
      
      // Default response when user is not verified
      return res.json({
        success: true,
        data: {
          userId,
          userType,
          isVerified: false,
          verificationStatus: null, // Set to null as default until verified
          message: 'User verification status not found'
        }
      });
    }

  } catch (error) {
    console.error('Error getting verification status:', error);
    
    // Return a standard response with null verification status
    return res.status(200).json({
      success: false,
      message: 'Error retrieving verification status',
      data: {
        userId,
        userType,
        isVerified: false,
        verificationStatus: null, // Set to null as default until verified
        error: 'Verification service unavailable'
      }
    });
  }
};

module.exports = {
  handleDojahWebhook,
  saveVerificationData,
  getVerificationStatus
};
