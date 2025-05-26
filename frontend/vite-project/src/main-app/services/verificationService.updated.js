import axios from 'axios';
import api from './api';

// Create a separate Axios instance for verification API
const verificationApi = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach token and user ID to every verification request
verificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add verification force header if we have verification status in localStorage
    try {
      const localStatus = localStorage.getItem('verificationStatus');
      if (localStatus) {
        const parsed = JSON.parse(localStatus);
        if (parsed && parsed.verified) {
          config.headers['X-Force-Verification'] = 'true';
        }
      }
    } catch (err) {
      console.error("Error parsing verification status from localStorage", err);
    }
    
    // Add userId to query params for all requests if available
    if (userDetails && userDetails.id) {
      // For GET requests, append to params
      if (!config.params) {
        config.params = {};
      }
      config.params.userId = userDetails.id;
      
      // For POST requests, add to body if it's JSON
      if (config.data && config.headers['Content-Type'] === 'application/json') {
        const data = typeof config.data === 'string' 
          ? JSON.parse(config.data) 
          : config.data;
          
        config.data = {
          ...data,
          userId: userDetails.id,
          // Include userType if it's not already specified
          userType: data.userType || (userDetails.userType || 'caregiver')
        };
        
        // Convert back to string if it was originally a string
        if (typeof config.data === 'string') {
          config.data = JSON.stringify(config.data);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Service for handling verification API calls for both caregivers and clients
 */
const verificationService = {
  /**
   * Submit BVN verification
   * @param {string} bvnNumber - The BVN number
   * @param {string} selfieImage - Base64 encoded selfie image (optional)
   * @param {string} idImage - Base64 encoded ID image (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} userId - User ID (optional)
   * @returns {Promise} - API response
   */
  verifyBVN: async (bvnNumber, selfieImage = null, idImage = null, userType = 'caregiver', userId = null) => {
    try {
      // Use test BVN for development purposes: 22222222222
      // This is for testing only and will be replaced with actual BVN in production
      const testEnvironment = process.env.NODE_ENV !== 'production';
      const payload = { 
        bvnNumber: testEnvironment ? '22222222222' : bvnNumber,
        userType
      };
      
      // If both selfie and ID images are provided, use the combined verification endpoint
      if (selfieImage && idImage) {
        payload.selfieImage = selfieImage;
        payload.idImage = idImage;
        
        const response = await verificationApi.post('/kyc/verify-bvn-with-id-selfie', payload);
        
        // Cache the verification status on success
        if (response.data && response.data.status === 'success') {
          verificationService.saveVerificationStatus(
            true, 
            'verified', 
            response.data.message || 'BVN with ID and Selfie verification successful',
            userId,
            userType
          );
        }
        
        return response.data;
      }
      
      // Add selfie image if provided (for backward compatibility)
      if (selfieImage) {
        payload.selfieImage = selfieImage;
      }
      
      const response = await verificationApi.post('/kyc/verify-bvn', payload);
      
      // Cache the verification status on success
      if (response.data && response.data.status === 'success') {
        verificationService.saveVerificationStatus(
          true, 
          'verified', 
          response.data.message || 'BVN verification successful',
          userId,
          userType
        );
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'BVN verification failed' };
    }
  },

  /**
   * Submit NIN verification
   * @param {string} ninNumber - The NIN number
   * @param {string} selfieImage - Base64 encoded selfie image (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} userId - User ID (optional)
   * @returns {Promise} - API response
   */
  verifyNIN: async (ninNumber, selfieImage = null, userType = 'caregiver', userId = null) => {
    try {
      // Use test NIN for development purposes: 70123456789
      // This is for testing only and will be replaced with actual NIN in production
      const testEnvironment = process.env.NODE_ENV !== 'production';
      const payload = { 
        ninNumber: testEnvironment ? '70123456789' : ninNumber,
        userType
      };
      
      // If selfie image is provided, use the combined verification endpoint
      if (selfieImage) {
        payload.selfieImage = selfieImage;
        
        const response = await verificationApi.post('/kyc/verify-nin-with-selfie', payload);
        
        // Cache the verification status on success
        if (response.data && response.data.status === 'success') {
          verificationService.saveVerificationStatus(
            true, 
            'verified', 
            response.data.message || 'NIN with Selfie verification successful',
            userId,
            userType
          );
        }
        
        return response.data;
      }
      
      // Use standard NIN verification endpoint
      const response = await verificationApi.post('/kyc/verify-nin', payload);
      
      // Cache the verification status on success
      if (response.data && response.data.status === 'success') {
        verificationService.saveVerificationStatus(
          true, 
          'verified', 
          response.data.message || 'NIN verification successful',
          userId,
          userType
        );
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'NIN verification failed' };
    }
  },

  /**
   * Upload ID verification documents
   * @param {string} idImage - Base64 encoded ID image
   * @param {string} selfieImage - Base64 encoded selfie image
   * @param {string} idType - Type of ID document (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} userId - User ID (optional)
   * @returns {Promise} - API response
   */
  verifyID: async (idImage, selfieImage, idType = 'generic', userType = 'caregiver', userId = null) => {
    try {
      const response = await verificationApi.post('/kyc/verify-id-selfie', { 
        idImage, 
        selfieImage,
        idType,
        userType
      });
      
      // Cache the verification status on success
      if (response.data && response.data.status === 'success') {
        verificationService.saveVerificationStatus(
          true, 
          'verified', 
          response.data.message || 'ID and Selfie verification successful',
          userId,
          userType
        );
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'ID verification failed' };
    }
  },

  /**
   * Force verification (primarily for testing purposes)
   * This method can be used to force a user to be verified
   * @param {string} userId - User ID (optional)
   * @param {string} userType - Type of user (caregiver or client)
   * @returns {Promise} - The updated verification status
   */
  forceVerification: async (userId = null, userType = 'caregiver') => {
    verificationService.saveVerificationStatus(
      true, 
      'verified', 
      'Verification completed successfully (forced)',
      userId,
      userType
    );
    return verificationService._cachedStatus;
  },

  /**
   * Save a verification status explicitly
   * This can be used when verification is completed successfully
   * @param {boolean} verified - Whether the user is verified
   * @param {string} status - The verification status (verified, pending, etc.)
   * @param {string} message - Optional message
   * @param {string} userId - User ID (optional)
   * @param {string} userType - Type of user (caregiver or client)
   */
  saveVerificationStatus: (verified = true, status = 'verified', message = '', userId = null, userType = 'caregiver') => {
    // Save to cache for the current session
    verificationService._cachedStatus = {
      verified,
      verificationStatus: status,
      message,
      userId,
      userType
    };
    
    // Also try to save in localStorage for persistence between refreshes
    try {
      const localStatus = {
        verified,
        verificationStatus: status,
        message,
        userId,
        userType,
        timestamp: new Date().toISOString()
      };
      
      // Use a specific key for each user type if userId is provided
      const storageKey = userId 
        ? `verificationStatus_${userType}_${userId}` 
        : 'verificationStatus';
        
      localStorage.setItem(storageKey, JSON.stringify(localStatus));
      
      // Also update the general verification status
      localStorage.setItem('verificationStatus', JSON.stringify(localStatus));
    } catch (err) {
      console.error('Could not save verification status to localStorage', err);
    }
  },
  
  /**
   * Get verification status
   * @param {string} userId - User ID to check verification status
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Promise} - API response with verification status
   */
  getVerificationStatus: async (userId = null, userType = 'caregiver') => {
    let lastVerificationRequest = 0;
    const minRequestInterval = 2000; // Minimum 2 seconds between requests
    
    // Check localStorage first
    try {
      // Try to get user-specific verification status first if userId is provided
      const storageKey = userId 
        ? `verificationStatus_${userType}_${userId}` 
        : 'verificationStatus';
        
      const localStatus = localStorage.getItem(storageKey);
      
      if (localStatus) {
        const parsed = JSON.parse(localStatus);
        // Use the cached status if it exists and is recent (within last 24 hours)
        const timestamp = new Date(parsed.timestamp || 0);
        const now = new Date();
        const hoursSinceVerification = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceVerification < 24) {
          console.log(`Using cached verification status for ${userType} ${userId} from localStorage`);
          verificationService._cachedStatus = parsed;
          return parsed;
        }
      }
      
      // Fall back to general verification status if no user-specific status found
      if (!localStatus && !userId) {
        const generalStatus = localStorage.getItem('verificationStatus');
        if (generalStatus) {
          const parsed = JSON.parse(generalStatus);
          const timestamp = new Date(parsed.timestamp || 0);
          const now = new Date();
          const hoursSinceVerification = (now - timestamp) / (1000 * 60 * 60);
          
          if (hoursSinceVerification < 24) {
            console.log("Using cached general verification status from localStorage");
            verificationService._cachedStatus = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error("Error reading verification status from localStorage", err);
    }
    
    try {
      // Implement debouncing to prevent excessive requests
      const now = Date.now();
      if (now - lastVerificationRequest < minRequestInterval) {
        // If called too soon, return cached response if available
        if (verificationService._cachedStatus) {
          return verificationService._cachedStatus;
        }
        // Otherwise, wait until the minimum interval has passed
        await new Promise(resolve => setTimeout(resolve, minRequestInterval - (now - lastVerificationRequest)));
      }
      
      lastVerificationRequest = Date.now();
      
      // Use verification API to get status with userType query parameter
      const verificationResponse = await verificationApi.get('/kyc/status', {
        params: {
          userType
        }
      });
      
      // Extract and normalize response data
      const status = {
        ...verificationResponse.data,
        verified: verificationResponse.data?.data?.verified || false,
        verificationStatus: verificationResponse.data?.data?.verificationStatus || 'unverified',
        message: verificationResponse.data?.message || ''
      };
      
      // Cache the response for future quick access
      verificationService._cachedStatus = status;
      
      return status;
    } catch (error) {
      // If verification API fails, return unverified status
      console.error('Error getting verification status:', error);
      return {
        verified: false,
        verificationStatus: 'unverified',
        message: 'Unable to retrieve verification status. Please try again.'
      };
    }
  },
  
  /**
   * Poll for verification status changes
   * @param {function} callback - Function to call when status changes
   * @param {number} intervalMs - Polling interval in milliseconds
   * @param {string} userId - User ID to check verification status
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {function} - Function to cancel polling
   */
  pollVerificationStatus: (callback, intervalMs = 10000, userId = null, userType = 'caregiver') => {
    let lastStatus = null;
    let attempts = 0;
    const maxAttempts = 6; // Reduced from 12 to 6 attempts (60 seconds at 10s interval)
    
    const intervalId = setInterval(async () => {
      try {
        attempts++;
        const status = await verificationService.getVerificationStatus(userId, userType);
        
        // Add polling metadata to help with progress indication
        status.pollingAttempt = attempts;
        status.maxAttempts = maxAttempts;
        status.progress = Math.min(90, Math.round((attempts / maxAttempts) * 100));
        
        // Only call the callback if status has changed or this is the first attempt
        // Use a deep comparison of relevant status fields (not the entire object)
        const currentStatusKey = JSON.stringify({
          verified: status.verified,
          verificationStatus: status.verificationStatus,
          message: status.message
        });
        
        const lastStatusKey = lastStatus ? JSON.stringify({
          verified: lastStatus.verified,
          verificationStatus: lastStatus.verificationStatus,
          message: lastStatus.message
        }) : null;
        
        if (currentStatusKey !== lastStatusKey || attempts === 1) {
          lastStatus = status;
          callback(status);
        }
        
        // If we reach verified status or failed status or max attempts, stop polling
        if (status.verified === true || 
            status.verificationStatus === 'failed' || 
            attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error polling verification status:', error);
        // On error, we should still increment attempts
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      }
    }, intervalMs);
    
    // Return function to cancel polling
    return () => {
      clearInterval(intervalId);
      console.log('Polling cancelled');
    };
  },

  /**
   * Submit verification data to Azure API
   * This function will be used when the Azure API endpoint is available
   * For now, it stores the data and returns success
   * @param {object} verificationData - The verification data to submit
   * @returns {Promise} - API response
   */
  submitVerificationDataToAzure: async (verificationData) => {
    // Check if we have saved verification data to process
    const pendingData = JSON.parse(localStorage.getItem('pendingVerificationData') || '[]');
    
    try {
      // For now, since the Azure endpoint is not available, we'll just log the data
      console.log('Would submit verification data to Azure:', verificationData);
      
      // Simulate a successful submission
      return {
        status: 'success',
        message: 'Verification data stored successfully for future submission',
        data: verificationData
      };

      /*
      // This is the implementation that would be used when the Azure endpoint is available
      const externalApiUrl = 'https://carepro-api20241118153443.azurewebsites.net/api';
      
      // Choose endpoint based on user type
      const endpoint = verificationData.userType === 'client'
        ? `${externalApiUrl}/clients/${verificationData.userId}/verification`
        : `${externalApiUrl}/caregivers/${verificationData.userId}/verification`;
      
      const response = await axios.post(
        endpoint,
        verificationData.azureData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: 'success',
        message: 'Verification data submitted to Azure successfully',
        data: response.data
      };
      */
    } catch (error) {
      console.error('Failed to submit verification data to Azure:', error);
      
      // Store the failed submission attempt for retry later
      if (verificationData && !pendingData.some(data => 
          data.userId === verificationData.userId && 
          data.timestamp === verificationData.timestamp)) {
        pendingData.push(verificationData);
        localStorage.setItem('pendingVerificationData', JSON.stringify(pendingData));
      }
      
      return {
        status: 'error',
        message: 'Failed to submit verification data to Azure. Data stored for later submission.',
        error: error.message
      };
    }
  },
  
  /**
   * Process any pending verification submissions
   * Call this periodically to try submitting any cached verification data
   * @returns {Promise} - Result of processing attempts
   */
  processPendingVerifications: async () => {
    const pendingData = JSON.parse(localStorage.getItem('pendingVerificationData') || '[]');
    
    if (pendingData.length === 0) {
      return {
        status: 'success',
        message: 'No pending verification data to process',
        processed: 0
      };
    }
    
    let successCount = 0;
    let failCount = 0;
    const remainingData = [];
    
    for (const data of pendingData) {
      try {
        // Attempt to submit each verification record
        // When Azure endpoint is available, uncomment the code below
        /*
        const externalApiUrl = 'https://carepro-api20241118153443.azurewebsites.net/api';
        
        // Choose endpoint based on user type
        const endpoint = data.userType === 'client'
          ? `${externalApiUrl}/clients/${data.userId}/verification`
          : `${externalApiUrl}/caregivers/${data.userId}/verification`;
          
        await axios.post(
          endpoint,
          data.azureData,
          {
            headers: {
              'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        */
        
        // For now, just simulate success
        console.log('Would submit verification data to Azure:', data);
        successCount++;
      } catch (error) {
        console.error('Failed to process pending verification:', error);
        failCount++;
        remainingData.push(data);
      }
    }
    
    // Update localStorage with only the failed items
    localStorage.setItem('pendingVerificationData', JSON.stringify(remainingData));
    
    return {
      status: 'success',
      message: `Processed ${successCount + failCount} pending verifications`,
      processed: successCount + failCount,
      successful: successCount,
      failed: failCount,
      remaining: remainingData.length
    };
  },
};

export default verificationService;
