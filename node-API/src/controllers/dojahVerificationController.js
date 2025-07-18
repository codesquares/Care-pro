const axios = require('axios');
const crypto = require('crypto');
// const config = require('../config');
const dotenv = require('dotenv');

// In-memory storage for webhook data (temporary bridge)
const webhookDataStore = new Map();

// Cleanup expired data every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of webhookDataStore.entries()) {
    if (now > data.expiresAt) {
      webhookDataStore.delete(userId);
      console.log(`Expired webhook data cleaned up for user: ${userId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

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
    // Add comprehensive logging to see what Dojah sends
    console.log('=== DOJAH WEBHOOK RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('================================');

    const signature = req.headers['x-dojah-signature'];
    
    // COMMENTED OUT: Signature verification for testing
    // if (!verifySignature(signature, req.body)) {
    //   console.error('Invalid webhook signature');
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }
    
    // Log signature for debugging
    if (signature) {
      console.log('Dojah signature received:', signature);
    } else {
      console.log('No Dojah signature header found');
    }

    const { event, data, metadata } = req.body;
    console.log('Received webhook:', { event, metadata });

    if (event === 'verification.completed') {
      const userId = metadata?.user_id;
      if (!userId) {
        console.error('No user ID in webhook metadata');
        return res.status(400).json({ error: 'Missing user ID' });
      }

      // Store webhook data temporarily in memory
      const webhookData = {
        timestamp: Date.now(),
        rawData: req.body,
        retrieved: false,
        expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours
      };

      webhookDataStore.set(userId, webhookData);
      console.log(`Webhook data stored for user ${userId}, expires in 12 hours`);

      return res.status(200).json({ status: 'success', message: 'Webhook data stored successfully' });
    }

    // Handle other webhook events
    console.log('Webhook event received but not handled:', event);
    return res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('Webhook handler error:', error);
    console.error('Error details:', error.response?.data || error.message);
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

// Get webhook data for a specific user
const getWebhookData = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const storedData = webhookDataStore.get(userId);

    if (!storedData) {
      return res.status(200).json({ 
        success: false, 
        status: 'not_found',
        message: 'No webhook data found for this user. Verification may not have been completed yet.',
        data: null
      });
    }

    // Check if data has expired
    if (Date.now() > storedData.expiresAt) {
      webhookDataStore.delete(userId);
      return res.status(200).json({ 
        success: false, 
        status: 'expired',
        message: 'Verification data has expired after 12 hours. Please complete verification again.',
        data: null
      });
    }

    // Mark as retrieved and optionally delete (uncomment if you want one-time access)
    // webhookDataStore.delete(userId);

    console.log(`Webhook data retrieved for user: ${userId}`);

    return res.status(200).json({ 
      success: true, 
      status: 'found',
      data: storedData.rawData,
      timestamp: storedData.timestamp,
      message: 'Webhook data retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving webhook data:', error);
    return res.status(500).json({ 
      success: false,
      status: 'error',
      error: 'Failed to retrieve webhook data',
      details: error.message 
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
      // Handle 404 as expected behavior - user not verified yet
      if (error.response && error.response.status === 404) {
        console.log(`✓ User ${userId} has not been verified yet (404 - expected)`);
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: false,
            verificationStatus: 'not_verified',
            message: 'User has not completed verification yet',
            needsVerification: true
          }
        });
      }
      
      // Log other errors as actual issues
      console.log('Error checking verification status:', error.message);
      
      // Default response for other errors
      return res.json({
        success: true,
        data: {
          userId,
          userType,
          isVerified: false,
          verificationStatus: 'unknown',
          message: 'Unable to verify current verification status',
          needsVerification: true
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
  getVerificationStatus,
  handleGetDojahWebhook,
  getWebhookData
};
