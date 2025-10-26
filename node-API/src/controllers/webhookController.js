// src/controllers/webhookController.js
const axios = require('axios');
const dojahService = require('../services/dojahService');
const { configDotenv } = require('dotenv');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

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
    
    // Store the webhook event for debugging
    webhookEvents.unshift({
      timestamp: new Date(),
      event: req.body,
      headers: req.headers
    });
    
    // Keep only the latest 10 events
    if (webhookEvents.length > 10) {
      webhookEvents.pop();
    }
    
    // Process webhook event
    const event = req.body;
    
    if (!event || !event.event) {
      throw new Error('Invalid webhook payload');
    }
    
    // Switch based on event type
    switch (event.event) {
      case 'verification.completed':
        await handleVerificationCompleted(event.data);
        break;
      case 'verification.failed':
        await handleVerificationFailed(event.data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.event}`);
    }
    
    // Acknowledge receipt of webhook
    return res.status(200).json({ 
      status: 'success', 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Error processing webhook', 
      error: error.message 
    });
  }
};

// Handle verification.completed event
const handleVerificationCompleted = async (data) => {
  try {
    if (!data || !data.reference_id) {
      throw new Error('Invalid verification completed data');
    }
    
    // Extract user ID from reference ID (assuming format like: user_123456)
    const userId = data.reference_id.startsWith('user_') 
      ? data.reference_id.split('user_')[1]
      : data.reference_id;
    
    if (!userId) {
      throw new Error('Invalid reference ID format');
    }
    
    // Determine verification result based on Dojah response
    const verificationResult = {
      status: 'verified',
      resultData: data,
      completedAt: new Date().toISOString()
    };
    
    // Update user verification status in Azure API
    await axios.patch(
      `${External_API}/users/${userId}/verification`, 
      verificationResult,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Verification completed for user ${userId}`);
  } catch (error) {
    console.error('Error handling verification completed:', error);
  }
};

// Handle verification.failed event
const handleVerificationFailed = async (data) => {
  try {
    if (!data || !data.reference_id) {
      throw new Error('Invalid verification failed data');
    }
    
    // Extract user ID from reference ID
    const userId = data.reference_id.startsWith('user_') 
      ? data.reference_id.split('user_')[1]
      : data.reference_id;
    
    if (!userId) {
      throw new Error('Invalid reference ID format');
    }
    
    // Determine failure reason from Dojah response
    const verificationResult = {
      status: 'failed',
      resultData: data,
      failureReason: data.failure_reason || 'Verification failed',
      completedAt: new Date().toISOString()
    };
    
    // Update user verification status in Azure API
    await axios.patch(
      `${External_API}/users/${userId}/verification`, 
      verificationResult,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Verification failed for user ${userId}`);
  } catch (error) {
    console.error('Error handling verification failed:', error);
  }
};

// Get recent webhook events for debugging (admin only)
const getWebhookEvents = (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: webhookEvents
    });
  } catch (error) {
    console.error('Get webhook events error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error getting webhook events',
      error: error.message
    });
  }
};

module.exports = {
  processWebhook,
  getWebhookEvents
};
