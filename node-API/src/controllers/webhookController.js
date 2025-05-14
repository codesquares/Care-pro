// src/controllers/webhookController.js
const User = require('../models/userModel');
const Verification = require('../models/verificationModel');
const axios = require('axios');
const dojahService = require('../services/dojahService');
const { configDotenv } = require('dotenv');
configDotenv();

// Store webhook events for debugging
const webhookEvents = [];

// Process incoming webhooks from Dojah
const processWebhook = async (req, res) => {
  try {
    // Verify webhook signature (implementation depends on Dojah's webhook security)
    const signature = req.headers['x-dojah-signature'];
    
    // If signature validation is available:
    // const isValid = validateSignature(req.body, signature, process.env.DOJAH_WEBHOOK_SECRET);
    // if (!isValid) throw new Error('Invalid webhook signature');
    
    const event = req.body;
    
    // Store event for debugging
    webhookEvents.unshift({
      id: event.id || Date.now(),
      type: event.type,
      data: event.data,
      receivedAt: new Date()
    });
    
    // Keep only the last 100 events
    if (webhookEvents.length > 100) {
      webhookEvents.length = 100;
    }
    
    // Handle different event types
    switch (event.type) {
      case 'verification.completed':
        await handleVerificationCompleted(event.data);
        break;
      
      case 'verification.failed':
        await handleVerificationFailed(event.data);
        break;
        
      // Add other event types as needed
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Handle completed verification
const handleVerificationCompleted = async (data) => {
  try {
    const { reference_id, verification_type, verification_status } = data;
    
    // Find the verification record
    const verification = await Verification.findOne({ referenceId: reference_id });
    
    if (!verification) {
      console.error(`No verification found with reference ID: ${reference_id}`);
      return;
    }
    
    // Update verification status
    verification.status = verification_status === 'approved' ? 'verified' : 'failed';
    verification.verificationData = data;
    verification.completedAt = new Date();
    await verification.save();
    
    // Update user verification status
    if (verification.user) {
      const user = await User.findById(verification.user);
      
      if (user) {
        // Initialize verification status if not exists
        if (!user.verificationStatus) {
          user.verificationStatus = {
            idVerified: false,
            addressVerified: false,
            qualificationVerified: false
          };
        }
        
        // Update specific verification type
        if (verification.type === 'nin' || verification.type === 'bvn') {
          user.verificationStatus.idVerified = verification.status === 'verified';
        } else if (verification.type === 'address') {
          user.verificationStatus.addressVerified = verification.status === 'verified';
        }
        
        // Check if all required verifications are complete
        if (user.verificationStatus.idVerified && 
            user.verificationStatus.addressVerified && 
            user.verificationStatus.qualificationVerified) {
          user.profileStatus = 'verified';
        } else if (verification.status === 'failed') {
          user.profileStatus = 'incomplete';
        }
        
        await user.save();
        
        // Sync with Azure API
        await syncWithAzureAPI(user._id, verification.status, verification.type);
      }
    }
  } catch (error) {
    console.error('Error handling verification completed:', error);
  }
};

// Handle failed verification
const handleVerificationFailed = async (data) => {
  try {
    const { reference_id } = data;
    
    // Find the verification record
    const verification = await Verification.findOne({ referenceId: reference_id });
    
    if (!verification) {
      console.error(`No verification found with reference ID: ${reference_id}`);
      return;
    }
    
    // Update verification status
    verification.status = 'failed';
    verification.verificationData = data;
    await verification.save();
    
    // Update user status if needed
    const user = await User.findById(verification.user);
    if (user && user.profileStatus !== 'rejected') {
      user.profileStatus = 'incomplete';
      await user.save();
      
      // Sync with Azure API
      await syncWithAzureAPI(user._id, 'failed', verification.verificationType);
    }
  } catch (error) {
    console.error('Error handling verification failed:', error);
  }
};

// Sync verification status with Azure API
const syncWithAzureAPI = async (userId, status, verificationType) => {
  try {
    if (!process.env.AZURE_API_ENDPOINT) {
      console.log('AZURE_API_ENDPOINT not configured, skipping sync');
      return;
    }
    
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return;
    }
    
    // Compile verification status data to send to Azure API
    const verificationData = {
      userId: userId,
      email: user.email,
      verificationType: verificationType,
      status: status,
      timestamp: new Date(),
      details: {
        idVerified: user.verificationStatus?.idVerified || false,
        addressVerified: user.verificationStatus?.addressVerified || false,
        qualificationVerified: user.verificationStatus?.qualificationVerified || false,
        overallStatus: user.profileStatus || 'pending'
      }
    };
    
    // Send status update to Azure API
    await axios.post(
      `${process.env.AZURE_API_ENDPOINT}/api/users/verification-update`,
      verificationData,
      {
        headers: {
          'Authorization': `ApiKey ${process.env.AZURE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-api-source': 'care-pro-node-api'
        }
      }
    );
    
    console.log(`Verification status synced with Azure API for user ${userId}`);
  } catch (error) {
    console.error('Failed to sync verification status with Azure API:', error.message);
    // Don't throw error, as we don't want to break the webhook flow
  }
};

// Get webhook events (for debugging)
const getWebhookEvents = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: webhookEvents.length,
    data: webhookEvents
  });
};

module.exports = {
  processWebhook,
  getWebhookEvents
};
