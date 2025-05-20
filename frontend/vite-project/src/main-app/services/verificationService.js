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
          userId: userDetails.id
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
 * Service for handling caregiver verification API calls
 */
const verificationService = {
  /**
   * Submit BVN verification
   * @param {string} bvnNumber - The BVN number
   * @param {string} selfieImage - Base64 encoded selfie image (optional)
   * @returns {Promise} - API response
   */
  verifyBVN: async (bvnNumber, selfieImage = null) => {
    try {
      // Use test BVN for development purposes: 22222222222
      // This is for testing only and will be replaced with actual BVN in production
      const testEnvironment = process.env.NODE_ENV !== 'production';
      const payload = { 
        bvnNumber: testEnvironment ? '22222222222' : bvnNumber 
      };
      
      // Add selfie image if provided
      if (selfieImage) {
        payload.selfieImage = selfieImage;
      }
      
      const response = await verificationApi.post('/kyc/verify-bvn', payload);
      
      // Cache the verification status on success
      if (response.data && response.data.status === 'success') {
        verificationService.saveVerificationStatus(
          true, 
          'verified', 
          response.data.message || 'BVN verification successful'
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
   * @returns {Promise} - API response
   */
  verifyNIN: async (ninNumber, selfieImage = null) => {
    try {
      // Use test NIN for development purposes: 70123456789
      // This is for testing only and will be replaced with actual NIN in production
      const testEnvironment = process.env.NODE_ENV !== 'production';
      const payload = { 
        ninNumber: testEnvironment ? '70123456789' : ninNumber
      };
      
      // Add selfie image if provided
      if (selfieImage) {
        payload.selfieImage = selfieImage;
      }
      
      const response = await verificationApi.post('/kyc/verify-nin', payload);
      
      // Cache the verification status on success
      if (response.data && response.data.status === 'success') {
        verificationService.saveVerificationStatus(
          true, 
          'verified', 
          response.data.message || 'NIN verification successful'
        );
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'NIN verification failed' };
    }
  },

  /**
   * Upload ID verification documents
   * @param {FormData} formData - Form data containing ID image and selfie
   * @returns {Promise} - API response
   */
  verifyID: async (idImage, selfieImage) => {
    try {
      const response = await verificationApi.post('/kyc/verify-id-selfie', { 
        idImage, 
        selfieImage 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'ID verification failed' };
    }
  },

  /**
   * Force verification (primarily for testing purposes)
   * This method can be used to force a user to be verified
   * @returns {Promise} - The updated verification status
   */
  forceVerification: async () => {
    verificationService.saveVerificationStatus(
      true, 
      'verified', 
      'Verification completed successfully (forced)'
    );
    return verificationService._cachedStatus;
  },

  /**
   * Save a verification status explicitly
   * This can be used when verification is completed successfully
   * @param {boolean} verified - Whether the user is verified
   * @param {string} status - The verification status (verified, pending, etc.)
   * @param {string} message - Optional message
   */
  saveVerificationStatus: (verified = true, status = 'verified', message = '') => {
    // Save to cache for the current session
    verificationService._cachedStatus = {
      verified,
      verificationStatus: status,
      message
    };
    
    // Also try to save in localStorage for persistence between refreshes
    try {
      const localStatus = {
        verified,
        verificationStatus: status,
        message,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('verificationStatus', JSON.stringify(localStatus));
    } catch (err) {
      console.error('Could not save verification status to localStorage', err);
    }
  },
  
  /**
   * Get verification status
   * @returns {Promise} - API response with verification status
   */
  getVerificationStatus: async () => {
    let lastVerificationRequest = 0;
    const minRequestInterval = 2000; // Minimum 2 seconds between requests
    
    // Check localStorage first
    try {
      const localStatus = localStorage.getItem('verificationStatus');
      if (localStatus) {
        const parsed = JSON.parse(localStatus);
        // Use the cached status if it exists and is recent (within last 24 hours)
        const timestamp = new Date(parsed.timestamp || 0);
        const now = new Date();
        const hoursSinceVerification = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceVerification < 24) {
          console.log("Using cached verification status from localStorage");
          verificationService._cachedStatus = parsed;
          return parsed;
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
      
      // Use verification API to get status
      const verificationResponse = await verificationApi.get('/kyc/status');
      
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
   * @returns {function} - Function to cancel polling
   */
  pollVerificationStatus: (callback, intervalMs = 10000) => {
    let lastStatus = null;
    let attempts = 0;
    const maxAttempts = 6; // Reduced from 12 to 6 attempts (60 seconds at 10s interval)
    
    const intervalId = setInterval(async () => {
      try {
        attempts++;
        const status = await verificationService.getVerificationStatus();
        
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
    return () => clearInterval(intervalId);
  }
};

export default verificationService;
