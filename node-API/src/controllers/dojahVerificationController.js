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

// Enhanced logging function with PII sanitization
const logWebhookData = (data, type = 'webhook') => {
  try {
    const timestamp = new Date().toISOString();
    const filename = `dojah-${type}-${timestamp.split('T')[0]}.json`;
    const filepath = path.join(logsDir, filename);
    
    // Sanitize sensitive data before logging
    const sanitizedData = sanitizeLogData(data);
    
    const logEntry = {
      timestamp,
      type,
      data: sanitizedData
    };
    
    // Append to daily log file
    fs.appendFileSync(filepath, JSON.stringify(logEntry, null, 2) + '\n---\n');
    console.log(`✅ Logged ${type} data to: ${filename}`);
  } catch (error) {
    console.error('❌ Failed to log webhook data:', error.message);
  }
};

// Function to sanitize sensitive data from logs
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'bvn', 'nin', 'phone_number', 'phone_number1', 'date_of_birth', 
    'first_name', 'last_name', 'middle_name', 'image', 'selfie_image',
    'photoid_image', 'id_number', 'email', 'address'
  ];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = value ? '[REDACTED]' : value;
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }
    return obj;
  };
  
  return sanitizeObject(sanitized);
};

// Enhanced input validation
const validateWebhookInput = (body, headers) => {
  const errors = [];
  
  // Validate required headers
  if (!headers['content-type'] || !headers['content-type'].includes('application/json')) {
    errors.push('Invalid content-type header');
  }
  
  if (!headers['user-agent']) {
    errors.push('Missing user-agent header');
  }
  
  // Validate body structure
  if (!body || typeof body !== 'object') {
    errors.push('Invalid request body');
  }
  
  if (body) {
    // Check for required fields for completed verification
    if (body.status === true && body.verification_status === 'Completed') {
      if (!body.reference_id && !body.user_id && !body.metadata?.user_id) {
        errors.push('Missing user identification in webhook');
      }
    }
    
    // Validate user ID format if present
    const userId = body.user_id || body.metadata?.user_id || 
                   (body.reference_id && body.reference_id.startsWith('user_') ? body.reference_id.split('_')[1] : null);
    
    if (userId && (!userId.match(/^[a-zA-Z0-9_-]+$/) || userId.length < 3 || userId.length > 50)) {
      errors.push('Invalid user ID format');
    }
    
    // Prevent suspicious payloads
    if (userId && (userId.toLowerCase().includes('admin') || userId.toLowerCase().includes('system'))) {
      errors.push('Suspicious user ID detected');
    }
  }
  
  return errors;
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

// Enhanced webhook signature verification
const verifySignature = (signature, body, secret) => {
  try {
    if (!signature || !secret) {
      return false;
    }
    
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    const hash = crypto
      .createHmac('sha256', secret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error.message);
    return false;
  }
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Simple rate limiter
const checkRateLimit = (ip) => {
  const now = Date.now();
  const windowMs = parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS) || 300000; // 5 minutes
  const maxRequests = parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS) || 100;
  
  const key = `webhook_${ip}`;
  const requests = rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  
  // Cleanup old entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      const recentRequests = v.filter(timestamp => now - timestamp < windowMs);
      if (recentRequests.length === 0) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return true;
};

// Auto-process verification to Azure backend with enhanced security and retry logic
const autoProcessVerificationToAzure = async (userId, webhookBody) => {
  const maxRetries = 3;
  let currentRetry = 0;
  
  try {
    console.log(`🔄 Auto-processing verification for user [REDACTED]...`);
    
    // Ensure we have user ID and verification data
    if (!userId || !webhookBody) {
      throw new Error('Missing user ID or webhook data for auto-processing');
    }
    
    // Format data for Azure with enhanced validation
    const formattedData = formatVerificationDataFromDojah(webhookBody, userId);
    
    // Check existing verification status before creating new record
    console.log(`🔍 Checking if new verification record should be created for user [REDACTED]...`);
    const existingVerification = await checkExistingVerificationStatus(userId);
    
    // Determine if we should create a new verification record
    const decision = shouldCreateNewVerification(
      existingVerification.status, 
      formattedData.verificationStatus
    );
    
    if (!decision.shouldCreate) {
      console.log(`⏭️ Skipping verification creation: ${decision.reason}`);
      
      // Log the skip decision
      logWebhookData({
        userId: '[REDACTED]',
        action: 'verification-skipped',
        existingStatus: existingVerification.status,
        newStatus: formattedData.verificationStatus,
        reason: decision.reason,
        verificationType: formattedData.verificationMethod
      }, 'verification-skipped');
      
      return { skipped: true, reason: decision.reason };
    }
    
    console.log(`✅ Creating new verification record: ${decision.reason}`);
    
    // Log the decision to create new record
    logWebhookData({
      userId: '[REDACTED]',
      action: 'verification-creation-approved',
      existingStatus: existingVerification.status,
      newStatus: formattedData.verificationStatus,
      reason: decision.reason,
      verificationType: formattedData.verificationMethod
    }, 'verification-creation-approved');
    
    // Send to Azure API with retry logic
    const apiEndpoint = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
    
    // Retry logic with exponential backoff
    while (currentRetry <= maxRetries) {
      try {
        // Use internal API key if available
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'CarePro-NodeAPI/1.0'
        };
        
        if (process.env.INTERNAL_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.INTERNAL_API_KEY}`;
        }
        
        const azureResponse = await axios.post(
          `${apiEndpoint}/Verifications`,
          formattedData,
          { 
            headers,
            timeout: 30000 // 30 second timeout
          }
        );

        if (azureResponse.status === 200 || azureResponse.status === 201) {
          console.log(`✅ Auto-processed verification for user [REDACTED] successfully`);
          
          // Log successful auto-processing
          logWebhookData({
            userId: '[REDACTED]',
            action: 'auto-process-success',
            backendStatus: azureResponse.status,
            verificationType: formattedData.verificationMethod,
            isVerified: formattedData.verificationStatus === 'verified',
            attempt: currentRetry + 1,
            processingTime: Date.now(),
            apiEndpoint: `${apiEndpoint}/Verifications`
          }, 'auto-process-success');

          // Mark as processed in memory
          const storedData = webhookDataStore.get(userId);
          if (storedData) {
            storedData.processed = true;
            storedData.processedAt = Date.now();
            storedData.backendResponse = {
              status: azureResponse.status,
              success: true,
              data: azureResponse.data,
              processedAt: new Date().toISOString()
            };
            webhookDataStore.set(userId, storedData);
          }

          // Backend will handle its own SignalR notifications when it processes the verification
          console.log(`✅ Backend will handle SignalR notifications through its existing system`);

          return azureResponse.data;
        } else {
          throw new Error(`Backend returned status ${azureResponse.status}`);
        }

      } catch (retryError) {
        currentRetry++;
        
        if (currentRetry > maxRetries) {
          throw retryError; // Re-throw the last error if all retries failed
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, currentRetry), 10000); // Max 10 seconds
        console.warn(`⚠️ Auto-process attempt ${currentRetry} failed, retrying in ${backoffDelay}ms:`, retryError.message);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    
  } catch (error) {
    console.error(`❌ Auto-processing failed for user [REDACTED]:`, error.message);
    
    // Update in-memory store with error details
    const storedData = webhookDataStore.get(userId);
    if (storedData) {
      storedData.processingAttempts = (storedData.processingAttempts || 0) + 1;
      storedData.lastProcessingError = error.message;
      storedData.lastProcessingAttempt = Date.now();
      storedData.processed = false;
      webhookDataStore.set(userId, storedData);
    }
    
    // Log the auto-processing error
    logWebhookData({
      userId: '[REDACTED]',
      action: 'auto-process-error',
      error: error.message,
      response: error.response?.data || 'No response data',
      status: error.response?.status || 'No status',
      attempts: currentRetry,
      maxRetries,
      apiEndpoint: `${process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api'}/Verifications`,
      errorType: error.response?.status === 404 && error.response?.data?.message?.includes('User MessageId') ? 'USER_NOT_FOUND_IN_DB' : 'OTHER_ERROR',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': process.env.INTERNAL_API_KEY ? '[PRESENT]' : '[NOT_SET]',
        'User-Agent': 'CarePro-NodeAPI/1.0'
      },
      requestBody: {
        format: 'AddVerificationRequest',
        fields: formattedData ? Object.keys(formattedData) : 'No data'
      },
      stack: error.stack?.split('\n')[0] // Only first line of stack
    }, 'auto-process-error');
    
    // Don't re-throw the error - this is a background process
    // The data remains in memory for manual retry via the polling endpoint
  }
};

// Format verification data for Azure (original function for backwards compatibility)
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

// Format verification data from Dojah's actual webhook structure
const formatVerificationDataFromDojah = (dojahWebhook, userId) => {
  let verificationNo = '';
  let verificationMethod = '';
  let firstName = '';
  let lastName = '';

  console.log('🔍 Formatting Dojah webhook data for user:', userId);
  console.log('📋 Raw webhook structure:', JSON.stringify(dojahWebhook, null, 2));

  // Extract data from the complex Dojah structure
  const governmentData = dojahWebhook.data?.government_data?.data;
  const userData = dojahWebhook.data?.user_data?.data;
  const idData = dojahWebhook.data?.id?.data?.id_data;

  // Get BVN information if available
  if (governmentData?.bvn?.entity) {
    const bvnEntity = governmentData.bvn.entity;
    verificationNo = bvnEntity.bvn;
    verificationMethod = 'BVN';
    firstName = bvnEntity.first_name?.trim() || '';
    lastName = bvnEntity.last_name?.trim() || '';
    console.log('✅ Found BVN data:', { verificationNo, firstName, lastName });
  }

  // Get NIN information if available and no BVN found
  if (!verificationNo && governmentData?.nin?.entity) {
    const ninEntity = governmentData.nin.entity;
    verificationNo = ninEntity.nin;
    verificationMethod = 'NIN';
    firstName = ninEntity.first_name?.trim() || '';
    lastName = ninEntity.last_name?.trim() || '';
    console.log('✅ Found NIN data:', { verificationNo, firstName, lastName });
  }

  // Fallback to user data if government data not available
  if (!firstName && userData) {
    firstName = userData.first_name || '';
    lastName = userData.last_name || '';
    console.log('📋 Using user data for names:', { firstName, lastName });
  }

  // Fallback to ID data if still not available
  if (!firstName && idData) {
    firstName = idData.first_name || '';
    lastName = idData.last_name?.replace(',', '') || ''; // Remove comma from last name
    console.log('📋 Using ID data for names:', { firstName, lastName });
  }

  // Get verification type from main webhook data if not found
  if (!verificationMethod) {
    verificationMethod = dojahWebhook.id_type || dojahWebhook.verification_type || 'DOJAH_VERIFICATION';
    console.log('📋 Using fallback verification method:', verificationMethod);
  }

  // Get verification number from main webhook data if not found
  if (!verificationNo) {
    verificationNo = dojahWebhook.value || dojahWebhook.verification_value || dojahWebhook.reference_id || '';
    console.log('📋 Using fallback verification number:', verificationNo);
  }

  // Ensure we have minimum required data
  if (!firstName || !lastName) {
    console.warn('⚠️ Missing name data in webhook, using fallback values');
    firstName = firstName || 'Unknown';
    lastName = lastName || 'User';
  }

  // Map Dojah webhook status to backend expected status
  let verificationStatus = 'failed'; // Default fallback
  
  // Handle different Dojah status formats
  if (dojahWebhook.status === true || dojahWebhook.status === 'success' || dojahWebhook.status === 'completed') {
    verificationStatus = 'success';
  } else if (dojahWebhook.status === 'pending' || dojahWebhook.status === 'processing' || dojahWebhook.verification_status === 'Pending') {
    verificationStatus = 'pending';
  } else if (dojahWebhook.status === false || dojahWebhook.status === 'failed' || dojahWebhook.status === 'cancelled') {
    verificationStatus = 'failed';
  } else {
    // Try to infer from verification_status field
    const webhookStatus = dojahWebhook.verification_status?.toLowerCase() || '';
    if (webhookStatus.includes('completed') || webhookStatus.includes('success')) {
      verificationStatus = 'success';
    } else if (webhookStatus.includes('pending') || webhookStatus.includes('processing')) {
      verificationStatus = 'pending';
    } else {
      verificationStatus = 'failed';
    }
  }

  const formattedData = {
    userId: userId.toString(),
    verifiedFirstName: firstName,
    verifiedLastName: lastName,
    verificationMethod,
    verificationNo: verificationNo.toString(),
    verificationStatus
  };

  console.log('✅ Final formatted data for Azure:', formattedData);
  console.log(`📊 Status mapping: Dojah(${dojahWebhook.status}/${dojahWebhook.verification_status}) → Backend(${verificationStatus})`);
  return formattedData;
};

// Function to check existing verification status for a user
const checkExistingVerificationStatus = async (userId) => {
  try {
    const apiEndpoint = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CarePro-NodeAPI/1.0'
    };
    
    if (process.env.INTERNAL_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.INTERNAL_API_KEY}`;
    }
    
    console.log(`🔍 Checking existing verification status for user [REDACTED]...`);
    
    const response = await axios.get(
      `${apiEndpoint}/Verifications/userId?userId=${encodeURIComponent(userId)}`,
      { 
        headers,
        timeout: 15000 // 15 second timeout
      }
    );
    
    if (response.status === 200 && response.data) {
      console.log(`✅ Found existing verification for user [REDACTED] with status: ${response.data.VerificationStatus}`);
      return {
        exists: true,
        status: response.data.VerificationStatus,
        verificationId: response.data.VerificationId
      };
    }
    
    return { exists: false, status: null, verificationId: null };
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`📝 No existing verification found for user [REDACTED] - first verification attempt`);
      return { exists: false, status: null, verificationId: null };
    }
    
    console.error(`❌ Error checking existing verification status for user [REDACTED]:`, error.message);
    
    // Log the error for debugging
    logWebhookData({
      error: 'Failed to check existing verification status',
      userId: '[REDACTED]',
      errorMessage: error.message,
      statusCode: error.response?.status,
      apiEndpoint: `${process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api'}/Verifications/userId`
    }, 'verification-check-error');
    
    // On error, assume no existing verification to avoid blocking valid requests
    return { exists: false, status: null, verificationId: null };
  }
};

// Function to determine if a new verification record should be created
const shouldCreateNewVerification = (existingStatus, newStatus) => {
  // If no existing record, always allow creation
  if (!existingStatus) {
    return { shouldCreate: true, reason: 'First verification attempt' };
  }
  
  // If status is different, allow creation (any status change is valid progression)
  if (existingStatus !== newStatus) {
    return { 
      shouldCreate: true, 
      reason: `Status change from '${existingStatus}' to '${newStatus}'` 
    };
  }
  
  // If status is the same, skip (duplicate)
  return { 
    shouldCreate: false, 
    reason: `Duplicate status '${existingStatus}' - skipping to prevent duplicate records` 
  };
};

// Handle Dojah webhook with enhanced security
const handleDojahWebhook = async (req, res) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Rate limiting check
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }
    
    // Input validation
    const validationErrors = validateWebhookInput(req.body, req.headers);
    if (validationErrors.length > 0) {
      console.warn('Webhook validation failed:', validationErrors);
      logWebhookData({
        error: 'Validation failed',
        errors: validationErrors,
        ip: clientIp,
        headers: sanitizeLogData(req.headers)
      }, 'validation-error');
      
      return res.status(400).json({ 
        error: 'Invalid webhook data',
        message: 'Webhook validation failed'
      });
    }
    
    // Enhanced logging with sanitization
    console.log('=== DOJAH WEBHOOK RECEIVED ===');
    console.log('IP:', clientIp);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('User-Agent:', req.headers['user-agent']?.substring(0, 100)); // Truncate long user agents
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('='.repeat(32)); // Separator line

    // Log the complete webhook data to file for debugging (sanitized)
    logWebhookData({
      ip: clientIp,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']?.substring(0, 100),
        'x-dojah-signature': req.headers['x-dojah-signature'] ? '[SIGNATURE_PRESENT]' : '[NO_SIGNATURE]'
      },
      body: req.body,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }, 'webhook-received');

    const signature = req.headers['x-dojah-signature'];
    const signatureVerificationEnabled = process.env.WEBHOOK_SIGNATURE_VERIFICATION === 'true';
    
    // Signature verification (can be disabled for development)
    if (signatureVerificationEnabled) {
      const webhookSecret = process.env.DOJAH_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('DOJAH_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      if (!signature) {
        console.error('Missing webhook signature');
        logWebhookData({
          error: 'Missing signature',
          ip: clientIp
        }, 'security-error');
        
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      if (!verifySignature(signature, req.body, webhookSecret)) {
        console.error('Invalid webhook signature');
        logWebhookData({
          error: 'Invalid signature',
          ip: clientIp,
          signatureProvided: !!signature
        }, 'security-error');
        
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Webhook signature verified');
    } else {
      console.log('⚠️ Webhook signature verification disabled');
      if (signature) {
        console.log('Dojah signature received but not verified:', signature ? '[SIGNATURE_PRESENT]' : '[NO_SIGNATURE]');
      }
    }

    // Extract and validate webhook data
    const { status, verification_status, data, metadata, reference_id } = req.body;
    console.log('Received webhook:', { status, verification_status, reference_id: reference_id ? '[PRESENT]' : '[MISSING]' });

    // Check if this is a verification webhook from Dojah (handle all statuses: pending, success, failed)
    const isVerificationWebhook = (
      // Completed verification
      (status === true && verification_status === 'Completed') ||
      // Pending verification  
      (verification_status === 'Pending' || status === 'pending') ||
      // Failed verification
      (status === false || status === 'failed' || status === 'cancelled') ||
      // Any webhook with verification_status field
      (verification_status && typeof verification_status === 'string') ||
      // Webhook with verification data structure
      (data && (data.government_data || data.user_data || data.id))
    );
    
    if (isVerificationWebhook) {
      console.log(`🎯 Processing verification webhook with status: ${status}/${verification_status}`);
      
      // Extract user ID from multiple possible sources with enhanced validation
      let userId = null;
      
      // Try to get userId from various webhook fields
      if (req.body.user_id) {
        userId = req.body.user_id;
      } else if (req.body.metadata?.user_id) {
        userId = req.body.metadata.user_id;
      } else if (reference_id && reference_id.startsWith('user_')) {
        // Extract from reference_id format: user_{userId}_{timestamp}
        const parts = reference_id.split('_');
        if (parts.length >= 2) {
          userId = parts[1];
        }
      } else if (reference_id) {
        userId = reference_id;
      }
      
      // Enhanced user ID validation
      if (!userId || 
          userId.startsWith('dojah-') || 
          userId.length < 3 || 
          userId.length > 50 ||
          !userId.match(/^[a-zA-Z0-9_-]+$/) ||
          userId.toLowerCase().includes('admin') ||
          userId.toLowerCase().includes('system')) {
        
        console.error('Invalid or suspicious user ID found in webhook data:', userId ? '[REDACTED]' : 'null');
        logWebhookData({
          error: 'Invalid user ID found in webhook data',
          userIdPresent: !!userId,
          referenceIdPresent: !!reference_id,
          ip: clientIp
        }, 'validation-error');
        
        return res.status(400).json({ 
          error: 'Invalid user identification', 
          message: 'Webhook must contain valid user identification' 
        });
      }

      console.log(`✅ Processing completed verification for user: [USER_${userId.length}_CHARS] (reference: ${reference_id ? '[PRESENT]' : '[MISSING]'})`);

      // Store webhook data temporarily in memory using user ID as key
      const webhookData = {
        timestamp: Date.now(),
        rawData: req.body,
        retrieved: false,
        expiresAt: Date.now() + (12 * 60 * 60 * 1000), // 12 hours
        referenceId: reference_id, // Keep reference ID for admin tracking
        processedAt: null,
        processed: false,
        ip: clientIp,
        processingAttempts: 0
      };

      webhookDataStore.set(userId, webhookData);
      console.log(`Webhook data stored for user [REDACTED], expires in 12 hours`);

      // Auto-process verification to Azure in background (with error handling)
      setTimeout(async () => {
        try {
          const result = await autoProcessVerificationToAzure(userId, req.body);
          
          if (result?.skipped) {
            console.log(`⏭️ Auto-processing skipped for user [REDACTED]: ${result.reason}`);
          } else {
            console.log(`✅ Auto-processed verification for user [REDACTED]`);
          }
        } catch (error) {
          console.error(`❌ Auto-processing failed for user [REDACTED]:`, error.message);
          
          // Update stored data to reflect processing failure
          const storedData = webhookDataStore.get(userId);
          if (storedData) {
            storedData.processingAttempts = (storedData.processingAttempts || 0) + 1;
            storedData.lastProcessingError = error.message;
            storedData.lastProcessingAttempt = Date.now();
            
            // Add specific error type for better debugging
            if (error.response?.status === 404 && error.response?.data?.message?.includes('User MessageId')) {
              storedData.errorType = 'USER_NOT_FOUND_IN_BACKEND_DB';
              console.warn(`⚠️ User [REDACTED] not found in backend database - verification data stored for manual processing`);
            } else {
              storedData.errorType = 'BACKEND_API_ERROR';
            }
            
            webhookDataStore.set(userId, storedData);
          }
        }
      }, 2000); // Process after 2 seconds to ensure frontend polling works

      const processingTime = Date.now() - startTime;
      console.log(`Webhook processing completed in ${processingTime}ms`);

      return res.status(200).json({ 
        status: 'success', 
        message: 'Webhook data stored successfully',
        processingTime: `${processingTime}ms`
      });
    }

    // Handle other webhook events that are not verification-related
    console.log('Webhook received but not a verification event:', { status, verification_status });
    logWebhookData({
      status,
      verification_status,
      referenceIdPresent: !!reference_id,
      note: 'Not a verification webhook',
      ip: clientIp
    }, 'unhandled-event');
    
    return res.status(200).json({ status: 'received' });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Log the error with sanitization
    logWebhookData({
      error: 'Webhook handler error',
      message: error.message,
      ip: clientIp,
      processingTime: `${Date.now() - startTime}ms`
    }, 'handler-error');
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Webhook processing failed'
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

    const webhookBody = storedData.rawData;

    // Check if this is a completed verification from Dojah
    if (webhookBody.status === true && webhookBody.verification_status === 'Completed') {
      // Format data for Azure using the new Dojah format
      const formattedData = formatVerificationDataFromDojah(webhookBody, userId);
      console.log('📋 Formatted data for Azure:', JSON.stringify(formattedData, null, 2));

      // Log the processing attempt
      logWebhookData({
        userId,
        action: 'processing-webhook-for-azure',
        rawDojahData: webhookBody,
        formattedForAzure: formattedData
      }, 'azure-submission');

      try {
        // Send to Azure API
        const apiEndpoint = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
        
        const azureResponse = await axios.post(
          `${apiEndpoint}/Verifications`,
          formattedData,
          {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          }
        );

        console.log('✅ Successfully sent verification data to Azure:', azureResponse.data);
        
        // Mark as processed and optionally remove from memory
        webhookDataStore.delete(userId);
        
        // Log successful submission
        logWebhookData({
          userId,
          action: 'azure-submission-success',
          azureResponse: azureResponse.data,
          formattedData
        }, 'azure-success');

        return res.status(200).json({
          success: true,
          message: 'Verification data successfully sent to Azure',
          azureResponse: azureResponse.data,
          formattedData: formattedData
        });
        
      } catch (azureError) {
        console.error('❌ Failed to send verification data to Azure:', azureError);
        
        // Log the Azure submission error
        logWebhookData({
          userId,
          action: 'azure-submission-error',
          error: azureError.message,
          response: azureError.response?.data,
          status: azureError.response?.status,
          formattedData
        }, 'azure-error');

        // Don't delete from memory on failure - allow retry
        return res.status(500).json({
          success: false,
          error: 'Failed to submit verification data to Azure',
          details: azureError.response?.data || azureError.message,
          retryable: true
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid webhook - not a completed verification'
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

    // Set cache control headers to prevent caching of polling responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${userId}-${Date.now()}"` // Dynamic ETag to prevent caching
    });

    const storedData = webhookDataStore.get(userId);

    if (!storedData) {
      return res.status(200).json({ 
        success: false, 
        status: 'not_found',
        message: 'No webhook data found for this user. Verification may not have been completed yet.',
        data: null,
        polledAt: new Date().toISOString()
      });
    }

    // Check if data has expired
    if (Date.now() > storedData.expiresAt) {
      webhookDataStore.delete(userId);
      return res.status(200).json({ 
        success: false, 
        status: 'expired',
        message: 'Verification data has expired after 12 hours. Please complete verification again.',
        data: null,
        polledAt: new Date().toISOString()
      });
    }

    // Mark as retrieved and optionally delete (uncomment if you want one-time access)
    // webhookDataStore.delete(userId);

    console.log(`Webhook data retrieved for user: ${userId} at ${new Date().toISOString()}`);

    return res.status(200).json({ 
      success: true, 
      status: 'found',
      data: storedData.rawData,
      timestamp: storedData.timestamp,
      message: 'Webhook data retrieved successfully',
      polledAt: new Date().toISOString(),
      processed: storedData.processed || false,
      processedAt: storedData.processedAt || null,
      azureResponse: storedData.processed ? storedData.azureResponse : null
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

// Save verification data (formats data but doesn't send to Azure)
const saveVerificationData = async (req, res) => {
  try {
    const { userId, verificationData } = req.body;

    if (!userId || !verificationData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Format data for Azure (but don't send it)
    const formattedData = formatVerificationData(verificationData, userId);

    // Log the formatted data
    logWebhookData({
      userId,
      action: 'save-verification-data-formatted',
      originalData: verificationData,
      formattedData: formattedData
    }, 'save-verification');

    return res.status(200).json({
      success: true,
      message: 'Verification data formatted successfully',
      formattedData: formattedData,
      note: 'Data formatted but not sent to Azure'
    });

  } catch (error) {
    console.error('Save verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to format verification data',
      details: error.message 
    });
  }
};

// Helper function to get status message
const getStatusMessage = (status) => {
  const messages = {
    'success': 'Your identity verification is complete!',
    'verified': 'Your identity verification is complete!',
    'pending': 'Your verification is being processed. You will be notified when complete.',
    'failed': 'Verification failed. Please try again with clear documents.',
    'not_verified': 'Please complete your identity verification to continue.'
  };
  
  return messages[status] || 'Verification status unknown.';
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

    
    try {
      // Get verification status summary from Azure API using new endpoint
      const apiEndpoint = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
      console.log(`Checking verification status summary from Azure API: ${apiEndpoint}`);

      const response = await axios.get(`${apiEndpoint}/Verifications/status/${userId}`, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      
      // If we get a successful response with verification status summary
      if (response.data) {
        const statusSummary = response.data;
        
        // Map backend status to frontend expected format
        const isVerified = statusSummary.currentStatus === 'success';
        const needsVerification = !statusSummary.hasAny || statusSummary.currentStatus === 'failed';
        
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: isVerified,
            verificationStatus: statusSummary.currentStatus,
            hasSuccess: statusSummary.hasSuccess,
            hasPending: statusSummary.hasPending,
            hasFailed: statusSummary.hasFailed,
            hasAny: statusSummary.hasAny,
            totalAttempts: statusSummary.totalAttempts,
            lastAttempt: statusSummary.lastAttempt,
            needsVerification: needsVerification,
            message: getStatusMessage(statusSummary.currentStatus),
            mostRecentRecord: statusSummary.mostRecentRecord
          }
        });
      } else {
        // No status summary returned
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
      
      // Handle 401 as authentication error - but still return unverified status
      if (error.response && error.response.status === 401) {
        console.log(`⚠️ Authentication error when checking user ${userId} verification status (401)`);
        return res.json({
          success: true,
          data: {
            userId,
            userType,
            isVerified: false,
            verificationStatus: 'not_verified',
            message: 'User has not completed verification yet',
            needsVerification: true,
            authNote: 'Could not authenticate with verification service'
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
        // Count verification status - updated for Dojah's format
        const webhookData = data.rawData;
        if (webhookData.status === true && webhookData.verification_status === 'Completed') {
          successfulVerifications++;
        } else if (webhookData.status === false) {
          failedVerifications++;
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

// Retry failed Azure submissions
const retryAzureSubmission = async (req, res) => {
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
        error: 'No webhook data found for this user. Data may have been processed or expired.' 
      });
    }

    // Check if already processed
    if (storedData.processed) {
      return res.status(200).json({
        success: true,
        message: 'Verification already processed successfully',
        azureResponse: storedData.azureResponse
      });
    }

    // Retry processing
    try {
      const result = await autoProcessVerificationToAzure(userId, storedData.rawData);
      
      if (result?.skipped) {
        return res.status(200).json({
          success: true,
          message: `Verification processing skipped: ${result.reason}`,
          skipped: true,
          reason: result.reason
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Verification retry successful',
        processed: true
      });
      
    } catch (retryError) {
      return res.status(500).json({
        success: false,
        error: 'Retry failed',
        details: retryError.message,
        retryable: true
      });
    }

  } catch (error) {
    console.error('Retry submission error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to retry submission',
      details: error.message 
    });
  }
};

// Admin: Get webhook system health and backend integration status
const getWebhookSystemHealth = async (req, res) => {
  try {
    console.log('🏥 Admin requesting webhook system health check...');
    
    const currentTime = Date.now();
    const last24Hours = currentTime - (24 * 60 * 60 * 1000);
    const last1Hour = currentTime - (60 * 60 * 1000);
    
    // Analyze current in-memory data
    const allData = Array.from(webhookDataStore.entries());
    const recentData = allData.filter(([_, data]) => data.timestamp > last24Hours);
    const veryRecentData = allData.filter(([_, data]) => data.timestamp > last1Hour);
    
    // Calculate statistics
    const totalWebhooks = allData.length;
    const recentWebhooks = recentData.length;
    const processed = allData.filter(([_, data]) => data.processed === true).length;
    const failed = allData.filter(([_, data]) => data.processingAttempts > 0 && !data.processed).length;
    const userNotFoundErrors = allData.filter(([_, data]) => data.errorType === 'USER_NOT_FOUND_IN_BACKEND_DB').length;
    const expiredData = allData.filter(([_, data]) => currentTime > data.expiresAt).length;
    
    // Test backend connectivity
    let backendHealth = {
      status: 'unknown',
      responseTime: null,
      error: null,
      endpoint: process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api'
    };
    
    try {
      const startTime = Date.now();
      const axios = require('axios');
      
      // Quick health check to backend
      await axios.get(`${backendHealth.endpoint}/health`, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'CarePro-HealthCheck/1.0'
        }
      });
      
      backendHealth.status = 'healthy';
      backendHealth.responseTime = Date.now() - startTime;
    } catch (error) {
      backendHealth.status = 'error';
      backendHealth.responseTime = Date.now() - startTime;
      backendHealth.error = error.message;
    }
    
    // Rate limiting health
    const rateLimitHealth = {
      currentConnections: rateLimitStore.size,
      isEnabled: process.env.WEBHOOK_SIGNATURE_VERIFICATION === 'true'
    };
    
    // Environment configuration health
    const configHealth = {
      webhookSecretConfigured: !!process.env.DOJAH_WEBHOOK_SECRET,
      signatureVerificationEnabled: process.env.WEBHOOK_SIGNATURE_VERIFICATION === 'true',
      apiUrlConfigured: !!process.env.API_URL,
      internalApiKeyConfigured: !!process.env.INTERNAL_API_KEY
    };
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      system: {
        status: failed > processed * 0.5 ? 'degraded' : (failed > 0 ? 'warning' : 'healthy'),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      webhook: {
        totalReceived: totalWebhooks,
        last24Hours: recentWebhooks,
        lastHour: veryRecentData.length,
        successfullyProcessed: processed,
        failed: failed,
        pendingInMemory: totalWebhooks - processed - failed,
        expiredEntries: expiredData
      },
      backend: backendHealth,
      rateLimiting: rateLimitHealth,
      configuration: configHealth,
      errors: {
        userNotFoundInBackend: userNotFoundErrors,
        totalProcessingFailures: failed,
        commonErrors: allData
          .filter(([_, data]) => data.lastProcessingError)
          .reduce((acc, [_, data]) => {
            const errorKey = data.lastProcessingError.substring(0, 50);
            acc[errorKey] = (acc[errorKey] || 0) + 1;
            return acc;
          }, {})
      },
      recommendations: []
    };
    
    // Generate recommendations
    if (userNotFoundErrors > 0) {
      healthReport.recommendations.push({
        type: 'warning',
        message: `${userNotFoundErrors} webhooks failed due to users not found in backend database. Check user ID mapping.`
      });
    }
    
    if (failed > processed * 0.2) {
      healthReport.recommendations.push({
        type: 'critical',
        message: `High failure rate: ${failed}/${totalWebhooks} webhooks failed processing. Check backend connectivity.`
      });
    }
    
    if (expiredData > 10) {
      healthReport.recommendations.push({
        type: 'info',
        message: `${expiredData} webhook entries have expired and may need cleanup.`
      });
    }
    
    if (backendHealth.status === 'error') {
      healthReport.recommendations.push({
        type: 'critical',
        message: `Backend API is not responding: ${backendHealth.error}`
      });
    }
    
    if (!configHealth.signatureVerificationEnabled) {
      healthReport.recommendations.push({
        type: 'security',
        message: 'Webhook signature verification is disabled. Enable for production security.'
      });
    }
    
    console.log(`📊 Generated health report: ${healthReport.system.status} status, ${totalWebhooks} total webhooks`);
    
    res.status(200).json({
      success: true,
      health: healthReport
    });
    
  } catch (error) {
    console.error('❌ Webhook health check failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate health report',
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
  processWebhookToAzure,
  retryAzureSubmission,
  getWebhookSystemHealth
};
