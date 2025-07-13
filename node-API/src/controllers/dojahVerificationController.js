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
        `${process.env.AZURE_API_URL}/api/Verifications`,
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
    const { userId, userType } = req.query;
    const {token} = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and userType are required parameters' 
      });
    }

    // Forward the request to Azure API to get verification status
    const apiEndpoint = process.env.LOCAL_API_URL || 'http://localhost:3000/api';
    console.log(`Using API endpoint: ${apiEndpoint}`);
    
    const response = await axios.get(`${apiEndpoint}/verification/status`, {
      params: { userId, userType },
      headers: {
        'Authorization': `Bearer ${req.headers.authorization}`,
        'Content-Type': 'application/json'
      }
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Error getting verification status:', error);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
      error: error.response?.data || error.message
    });
  }
};

module.exports = {
  handleDojahWebhook,
  saveVerificationData,
  getVerificationStatus
};
