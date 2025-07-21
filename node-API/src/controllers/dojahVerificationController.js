const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
// const config = require('../config');
const dotenv = require('dotenv');

// In-memory storage for webhook data (temporary bridge)
const webhookDataStore = new Map();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Function to log webhook data to file for debugging
const logWebhookData = (data, type = 'webhook') => {
  try {
    const timestamp = new Date().toISOString();
    const filename = `dojah-${type}-${timestamp.split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);
    
    const logEntry = {
      timestamp,
      type,
      data
    };
    
    // Append to daily log file
    fs.appendFileSync(filepath, JSON.stringify(logEntry, null, 2) + '\n---\n');
    console.log(`✅ Logged ${type} data to: ${filename}`);
  } catch (error) {
    console.error('❌ Failed to log webhook data:', error.message);
  }
};

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

    // Log the complete webhook data to file for debugging
    logWebhookData({
      headers: req.headers,
      body: req.body,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }, 'webhook-received');

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
        logWebhookData({
          error: 'No user ID in webhook metadata',
          body: req.body
        }, 'error');
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

      // AUTOMATICALLY SEND TO AZURE BACKEND
      try {
        console.log('🚀 Attempting to send data to Azure backend...');
        
        // Format the data for Azure backend
        const formattedData = formatVerificationData(data, userId);
        console.log('📋 Formatted data for Azure:', JSON.stringify(formattedData, null, 2));
        
        // Log the formatted data
        logWebhookData({
          userId,
          rawDojahData: data,
          formattedForAzure: formattedData
        }, 'formatted-data');

        // Send to Azure backend
        const azureApiUrl = process.env.AZURE_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
        console.log(`📡 Sending to Azure: ${azureApiUrl}/Verifications`);
        
        // Note: We don't have user token here, so this might fail with auth error
        // The formatted data will be logged so you can see what would be sent
        logWebhookData({
          action: 'would-send-to-azure',
          endpoint: `${azureApiUrl}/Verifications`,
          data: formattedData,
          note: 'Token required for actual sending'
        }, 'azure-attempt');

        console.log('✅ Data formatted and logged. Check logs for mapping details.');
        
      } catch (azureError) {
        console.error('❌ Azure backend error:', azureError.message);
        logWebhookData({
          error: 'Azure backend error',
          details: azureError.message,
          userId,
          rawData: data
        }, 'azure-error');
      }

      return res.status(200).json({ status: 'success', message: 'Webhook data stored and logged successfully' });
    }

    // Handle other webhook events
    console.log('Webhook event received but not handled:', event);
    logWebhookData({
      event,
      data,
      metadata,
      note: 'Event type not handled'
    }, 'unhandled-event');
    
    return res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('Webhook handler error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Log the error
    logWebhookData({
      error: 'Webhook handler error',
      details: error.response?.data || error.message,
      stack: error.stack
    }, 'handler-error');
    
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

// Process stored webhook data and send to Azure (with auth token)
const processWebhookToAzure = async (req, res) => {
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
      return res.status(404).json({ 
        success: false, 
        error: 'No webhook data found for this user' 
      });
    }

    // Check if data has expired
    if (Date.now() > storedData.expiresAt) {
      webhookDataStore.delete(userId);
      return res.status(410).json({ 
        success: false, 
        error: 'Webhook data has expired' 
      });
    }

    const { event, data, metadata } = storedData.rawData;

    if (event === 'verification.completed') {
      // Format data for Azure
      const formattedData = formatVerificationData(data, userId);
      console.log('📋 Formatted data for Azure:', JSON.stringify(formattedData, null, 2));

      // Log the processing attempt
      logWebhookData({
        userId,
        action: 'manual-processing-to-azure',
        rawDojahData: data,
        formattedForAzure: formattedData
      }, 'manual-process');

      // Send to Azure backend with auth token
      const azureApiUrl = process.env.AZURE_API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
      
      try {
        const response = await axios.post(
          `${azureApiUrl}/Verifications`,
          formattedData,
          {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Successfully sent to Azure backend');
        
        // Log success
        logWebhookData({
          userId,
          action: 'successfully-sent-to-azure',
          azureResponse: response.data,
          status: response.status
        }, 'azure-success');

        // Mark as processed (optional: remove from memory)
        // webhookDataStore.delete(userId);

        return res.status(200).json({
          success: true,
          message: 'Verification data successfully sent to Azure backend',
          azureResponse: response.data
        });

      } catch (azureError) {
        console.error('❌ Failed to send to Azure backend:', azureError.response?.data || azureError.message);
        
        // Log the Azure error
        logWebhookData({
          userId,
          action: 'failed-to-send-to-azure',
          error: azureError.response?.data || azureError.message,
          status: azureError.response?.status,
          formattedData
        }, 'azure-error');

        return res.status(500).json({
          success: false,
          error: 'Failed to send to Azure backend',
          details: azureError.response?.data || azureError.message
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid webhook event type'
    });

  } catch (error) {
    console.error('Process webhook error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook data',
      details: error.message 
    });
  }
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

// Get all webhook data for admin users
const getAllWebhookData = async (req, res) => {
  try {
    // Admin authentication is now handled by middleware
    // No need to manually check userRole - middleware ensures only admins reach this point
    
    console.log(`Admin user (${req.user?.email}) accessing all webhook data`);

    // Get all webhook data from memory store
    const allWebhookData = [];
    const now = Date.now();
    
    for (const [userId, data] of webhookDataStore.entries()) {
      // Check if data has expired and clean it up
      if (now > data.expiresAt) {
        webhookDataStore.delete(userId);
        console.log(`Expired webhook data cleaned up for user: ${userId}`);
        continue;
      }
      
      // Add non-expired data to result
      allWebhookData.push({
        userId,
        timestamp: data.timestamp,
        retrieved: data.retrieved,
        expiresAt: data.expiresAt,
        expiresIn: Math.max(0, Math.round((data.expiresAt - now) / (60 * 60 * 1000))), // Hours until expiry
        webhookData: data.rawData
      });
    }

    // Sort by timestamp (newest first)
    allWebhookData.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`Admin user accessed all webhook data. Found ${allWebhookData.length} records.`);

    return res.status(200).json({
      success: true,
      message: `Retrieved ${allWebhookData.length} webhook records`,
      data: allWebhookData,
      metadata: {
        totalRecords: allWebhookData.length,
        retrievedAt: new Date().toISOString(),
        memoryStoreSize: webhookDataStore.size
      }
    });

  } catch (error) {
    console.error('Error retrieving all webhook data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve webhook data',
      details: error.message
    });
  }
};

// Get webhook statistics for admin dashboard
const getWebhookStatistics = async (req, res) => {
  try {
    // Admin authentication is now handled by middleware
    console.log(`Admin user (${req.user?.email}) accessing webhook statistics`);

    const now = Date.now();
    let totalRecords = 0;
    let expiredRecords = 0;
    let successfulVerifications = 0;
    let failedVerifications = 0;
    const last24Hours = now - (24 * 60 * 60 * 1000);
    let recentVerifications = 0;

    for (const [userId, data] of webhookDataStore.entries()) {
      totalRecords++;
      
      if (now > data.expiresAt) {
        expiredRecords++;
      } else {
        // Count verification status
        const webhookData = data.rawData;
        if (webhookData.event === 'verification.completed') {
          const verificationStatus = webhookData.data?.status;
          if (verificationStatus === 'success') {
            successfulVerifications++;
          } else {
            failedVerifications++;
          }
        }
        
        // Count recent verifications (last 24 hours)
        if (data.timestamp > last24Hours) {
          recentVerifications++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      statistics: {
        totalRecords,
        activeRecords: totalRecords - expiredRecords,
        expiredRecords,
        successfulVerifications,
        failedVerifications,
        recentVerifications,
        memoryStoreSize: webhookDataStore.size,
        successRate: totalRecords > 0 ? ((successfulVerifications / (successfulVerifications + failedVerifications)) * 100).toFixed(2) : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving webhook statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve webhook statistics',
      details: error.message
    });
  }
};

module.exports = {
  handleDojahWebhook,
  saveVerificationData,
  getVerificationStatus,
  handleGetDojahWebhook,
  getWebhookData,
  getAllWebhookData,
  getWebhookStatistics,
  processWebhookToAzure
};
