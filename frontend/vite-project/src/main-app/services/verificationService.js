import axios from 'axios';
import api from './api';
import config from '../config';



/**
 * 
 * All required inputs for verfication
 * bvnNumber or ninNumber (as appropriate)
 * selfieImage (required for selfie flows)
 * idImage (required for BVN with ID+selfie)
 * userType
 * token
 * id (for user validation)
 **/
// Create a separate Axios instance for verification API calls
const verificationApi = axios.create({
  baseURL: config.LOCAL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach token and user ID to every verification request
verificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    
    // Log outgoing requests for debugging
    console.log(`Verification API Request: ${config.method} ${config.url}`);
    console.log('Request config:', { 
      headers: config.headers,
      params: config.params,
      data: config.data
    });
    
    // Add auth token to all requests if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization token added to request');
    } else {
      console.warn('No auth token found for verification API request:', config.url);
    }
    
    // Add verification force header if we have verification status in localStorage
    try {
      // Try to get user-specific verification status if userId is in params
      let storageKey = 'verificationStatus';
      if (config.params?.userId && config.params?.userType) {
        storageKey = `verificationStatus_${config.params.userType}_${config.params.userId}`;
      } else if (userDetails && userDetails.id) {
        // Default to user-specific key if not in params but user is available
        const userType = userDetails.userType || 'caregiver';
        storageKey = `verificationStatus_${userType}_${userDetails.id}`;
      }
      
      const localStatus = localStorage.getItem(storageKey) || localStorage.getItem('verificationStatus');
      if (localStatus) {
        const parsed = JSON.parse(localStatus);
        if (parsed && parsed.verified) {
          config.headers['X-Force-Verification'] = 'true';
        }
      }
    } catch (err) {
      console.error("Error parsing verification status from localStorage", err);
    }
    
    // Add userId and userType to all requests if available
    if (userDetails && userDetails.id) {
      // Get user type with a fallback
      let userType = userDetails.userType || 'caregiver';
      
      // Normalize userType to standard formats
      if (userType.toLowerCase().includes('client')) {
        userType = 'client';
      } else if (userType.toLowerCase().includes('care')) {
        userType = 'caregiver';
      }
      
      console.log(`Adding auth data to request: userId=${userDetails.id}, userType=${userType}`);
      
      // For GET requests, append to params
      if (!config.params) {
        config.params = {};
      }
      
      // Always set these values to ensure consistency
      config.params.userId = userDetails.id;
      config.params.userType = userType;
      
      // For POST requests, add to body if it's JSON
      if (config.method === 'post' && config.data && config.headers['Content-Type'].includes('application/json')) {
        let data = config.data;
        
        // Parse if it's a string
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            console.error('Error parsing request data as JSON:', e);
          }
        }
        
        // Only if it's an object, add the properties
        if (typeof data === 'object' && data !== null) {
          // Always set userId and userType for consistency with query params
          data.userId = userDetails.id;
          data.userType = userType;
          
          // Convert back to string if it was originally a string
          if (typeof config.data === 'string') {
            config.data = JSON.stringify(data);
          } else {
            config.data = data;
          }
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
verificationApi.interceptors.response.use(
  (response) => {
    console.log(`Verification API Response (${response.config.url}):`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Verification API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

/**
 * Service for handling verification API calls for both caregivers and clients
 */
const verificationService = {
  // Cache for the most recent verification status
  _cachedStatus: null,
  
  // Track last verification request timestamp for debouncing
  _lastVerificationRequest: 0,

  /**
   * Helper function to get test values for different verification types
   * @param {string} type - Type of verification data (bvn, nin, etc.)
   * @param {string} value - Original value
   * @returns {string} - Test value for development environment or original value for production
   */
  _getTestValue(type, value) {
    // Use user input as default; only use test value if input is empty/null/undefined
    console.log('[verificationService] _getTestValue called with:', { type, value });
    if (value && value.trim && value.trim() !== '') {
      console.log('[verificationService] Using user input value:', value);
      return value;
    }
    const testValues = {
      bvn: '22222222222',
      nin: '70123456789'
    };
    console.log('[verificationService] Using test value for', type, ':', testValues[type] || '');
    return testValues[type] || '';
  },

  /**
   * Submit BVN verification
   * @param {string} bvnNumber - The BVN number
   * @param {string} selfieImage - Base64 encoded selfie image (optional)
   * @param {string} idImage - Base64 encoded ID image (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Promise} - API response
   */
  
  async verifyBVN(bvnNumber, selfieImage, idImage, userType, id, token ) {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      if (!userType) {
        userType = userDetails.userType || 'caregiver';
      }
      const userId = userDetails?.id;
      if(userId !== id){
        throw new Error('User ID mismatch. Please check your authentication details.');
      }
      if (!bvnNumber) {
        throw new Error('BVN number is required for verification');
      }

      // Step 1: Only BVN provided (stepwise verification)
      if (!selfieImage && !idImage) {
        const bvnToSend = this._getTestValue('bvn', bvnNumber);
        console.log('[verificationService] verifyBVN step 1 - BVN to send:', bvnToSend);
        const payload = {
          bvnNumber: bvnToSend,
          userType,
          userId: userDetails.id,
          id: userDetails.id,
          token: token,
          firstName: userDetails.firstName || '',
          lastName: userDetails.lastName || '',
          selfieImage: selfieImage || null,
          idImage: idImage || null
        };
        console.log('[verificationService] verifyBVN step 1 - payload:', payload);
        try {
          const response = await verificationApi.post('/kyc/verify-bvn', payload);
          console.log('[verificationService] verifyBVN step 1 - dojah response:', response.data);
          return response.data;
        } catch (error) {
          throw error.response?.data || { message: 'BVN verification failed' };
        }
      }

      // Step 2: Both selfie 
      if (selfieImage ) {
        const bvnToSend = this._getTestValue('bvn', bvnNumber);
        console.log('[verificationService] verifyBVN step 2 - BVN to send:', bvnToSend);
        const payload = {
          bvnNumber: bvnToSend,
          userType,
          userId: userDetails.id,
          id: userDetails.id,
          token: token,
          firstName: userDetails.firstName || '',
          lastName: userDetails.lastName || '',
          idImage: idImage,
          selfieImage: selfieImage
        };
        console.log('[verificationService] verifyBVN step 2 - payload:', payload);
        try {
          const response = await verificationApi.post('/kyc/verify-bvn-with-id-selfie', payload);
          console.log('[verificationService] verifyBVN step 2 - dojah response:', response.data);
          // if (response.data?.entity.verified === true && response.data?.entity.verificationStatus === 'verified') {
          //   this.saveVerificationStatus(
          //     true, 
          //     'verified', 
          //     response.data.message || 'BVN with ID and Selfie verification successful',
          //     userDetails.id,
          //     userType
          //   );
          //   // Save to Azure endpoint
          //   await this.saveVerificationData({
          //     userId: userDetails.id,
          //     verifiedFirstName: response.data?.entity.first_name || '',
          //     verifiedLastName: response.data?.entity.last_name || '',
          //     verifiedDateOfBirth: response.data?.entity.date_of_birth || '',
          //     verificationMethod: 'BVN',
          //     verificationNo: bvnNumber,
          //     verificationStatus: response.data?.entity.verificationStatus || 'verified'
          //   });
          // }
          return response.data;
        } catch (error) {
          console.error('Error with BVN + ID + Selfie verification:', error);
          throw error.response?.data || { message: 'BVN verification failed' };
        }
      }

      // If only one of the images is provided, throw error
      throw new Error('Both selfieImage and idImage must be provided for full verification');
    } catch (error) {
      throw error.response?.data || { message: 'BVN verification failed' };
    }
  },  /**
   * Submit NIN verification
   * @param {string} ninNumber - The NIN number
   * @param {string} selfieImage - Base64 encoded selfie image (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Promise} - API response
   */
  async verifyNIN(ninNumber, selfieImage, userType, idImage, id, token) {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      if (!userType) {
        userType = userDetails.userType || 'caregiver';
      }
      if (!ninNumber) {
        throw new Error('NIN number is required for verification');
      }

      // Step 1: Only NIN provided (stepwise verification)
      if (!selfieImage && !idImage) {
        const ninToSend = this._getTestValue('nin', ninNumber);
        console.log('[verificationService] verifyNIN step 1 - NIN to send:', ninToSend);
        const payload = {
          ninNumber: ninToSend,
          userType,
          userId: userDetails.id,
          id: userDetails.id,
          token: token,
          firstName: userDetails.firstName || '',
          lastName: userDetails.lastName || ''
        };
        console.log('[verificationService] verifyNIN step 1 - payload:', payload);
        try {
          const response = await verificationApi.post('/kyc/verify-nin', payload);
          console.log('[verificationService] verifyNIN step 1 - dojah response:', response.data);
          return response.data;
        } catch (error) {
          throw error.response?.data || { message: 'NIN verification failed' };
        }
      }

      // Step 2: Both selfie and ID images provided (full verification)
      if (selfieImage && idImage) {
        const ninToSend = this._getTestValue('nin', ninNumber);
        console.log('[verificationService] verifyNIN step 2 - NIN to send:', ninToSend);
        const payload = {
          ninNumber: ninToSend,
          userType,
          userId: userDetails.id,
          id: userDetails.id,
          token: token,
          firstName: userDetails.firstName || '',
          lastName: userDetails.lastName || '',
          idImage: idImage,
          selfieImage: selfieImage
        };
        console.log('[verificationService] verifyNIN step 2 - payload:', payload);
        try {
          const response = await verificationApi.post('/kyc/verify-nin-with-selfie', payload);
          console.log('[verificationService] verifyNIN step 2 - dojah response:', response.data);
          // if (response.data?.entity.verified === true && response.data?.entity.verificationStatus === 'verified') {
          //   this.saveVerificationStatus(
          //     true, 
          //     'verified', 
          //     response.data.message || 'NIN with Selfie verification successful',
          //     userDetails.id,
          //     userType
          //   );
          //   // Save to Azure endpoint
          //   await this.saveVerificationData({
          //     userId: userDetails.id,
          //     verifiedFirstName: response.data?.entity.first_name || '',
          //     verifiedLastName: response.data?.entity.last_name || '',
          //     verificationMethod: 'NIN',
          //     verificationNo: ninNumber,
          //     date_of_birth: response.data?.entity.date_of_birth || '',
          //     verificationStatus: 'verified'
          //   });
          // }
          return response.data;
        } catch (error) {
          console.error('Error with NIN + Selfie verification:', error);
          throw error.response?.data || { message: 'NIN verification failed' };
        }
      }

      // If only one of the images is provided, throw error
      throw new Error('Both selfieImage and idImage must be provided for full verification');
    } catch (error) {
      throw error.response?.data || { message: 'NIN verification failed' };
    }
  },

  /**
   * Submit a complete BVN verification with ID and selfie in one request
   * This should be the primary verification method for both clients and caregivers
   * @param {string} bvnNumber - The BVN number
   * @param {string} selfieImage - Base64 encoded selfie image
   * @param {string} idImage - Base64 encoded ID image
   * @param {string} idType - Type of ID document
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} userId - User ID for tracking
   * @returns {Promise} - API response
   */
  async verifyBVNComplete(bvnNumber, selfieImage, idImage, idType, userType, userId , token, id) {
    try {
      const payload = { 
        bvnNumber: this._getTestValue('bvn', bvnNumber),
        selfieImage: selfieImage,
        idImage: idImage,
        idType: idType,
        userType: userType,
        id: id,
        token: token
      };
      
      try {
        const response = await verificationApi.post('/kyc/verify-bvn-with-id-selfie', payload);

        // Cache the verification status on success
        // if (response.data && (response.data.entity.verified === true)) {
          // this.saveVerificationStatus(
          //   {
          //     verified: true,
          //     status: 'verified',
          //     message: response.data.message || 'BVN with ID and Selfie verification successful',
          //     userId: userDetails.id,
          //     userType: userType
          //   }
          // );
          //   // Save to Azure endpoint
          //   await this.saveVerificationData({
          //     userId: userDetails.id,
          //     verifiedFirstName: response.data?.entity.first_name || '',
          //     verifiedLastName: response.data?.entity.last_name || '',
          //     verifiedDateOfBirth: response.data?.entity.date_of_birth || '',
          //     verificationMethod: 'BVN',
          //     verificationNo: bvnNumber,
          //     verificationStatus: response.data?.entity.verificationStatus || 'verified'
          //   });

          // }

        return response.data ? response.data : { status: 'error', message: 'No data returned from verification API' };


      } catch (error) {
        console.error('Error with complete BVN verification:', error);
        
        // If we get a 404, try falling back to regular BVN verification
        if (error.response?.status === 404) {
          console.log('Combined endpoint not found, falling back to separate verifications...');
          
          // First verify BVN
          const bvnResponse = await this.verifyBVN(bvnNumber, null, null, userType, userId);

          if (bvnResponse.data?.entity.verified !== true) {
            return bvnResponse; // Return BVN verification error
          }
          
          // Then verify ID + Selfie
          const idSelfieResponse = await this.verifyID(idImage, selfieImage, idType, userType, bvnNumber, ninNumber);
          
          // Combine responses
          console.log('Combined verification response:', {
            bvn: bvnResponse.data,
            idSelfie: idSelfieResponse.data
          });
          return {
            status: idSelfieResponse.data?.entity.verified,
            message: 'Combined verification process completed',
            data: {
              ...bvnResponse.data,
              idSelfie: idSelfieResponse.data
            }
            
          };
          
        } else {
          throw error;
        }
      }
    } catch (error) {
      throw error.response?.data || { message: 'Complete BVN verification failed' };
    }
  },
  
  /**
   * Submit a complete NIN verification with selfie in one request
   * This should be used for NIN verification for both clients and caregivers
   * @param {string} ninNumber - The NIN number
   * @param {string} selfieImage - Base64 encoded selfie image
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} userId - User ID for tracking
   * @returns {Promise} - API response
   */
  async verifyNINComplete(ninNumber, selfieImage, userType = 'caregiver', userId = null) {
    try {
      const payload = { 
        ninNumber: this._getTestValue('nin', ninNumber),
        selfieImage: selfieImage,
        userType: userType
      };
      
      try {
        const response = await verificationApi.post('/kyc/verify-nin-with-selfie', payload);
        
        // if (response.data && (response.data.entity.verified === true)) {
        //   this.saveVerificationStatus(
        //     true, 
        //     'verified', 
        //     response.data.message || 'NIN with Selfie verification successful',
        //     userId,
        //     userType
        //   );
        //   // Save to Azure endpoint
        //   await this.saveVerificationData({
        //     userId: userId,
        //     verifiedFirstName: response.data?.entity.first_name || '',
        //     verifiedLastName: response.data?.entity.last_name || '',
        //     verificationMethod: 'NIN',
        //     verificationNo: ninNumber,
        //     verificationStatus: response.data?.entity.verificationStatus || 'verified'
        //   });
        // }
        
        return response.data ? response.data : { status: 'error', message: 'No data returned from verification API' };
      } catch (error) {
        console.error('Error with complete NIN verification:', error);
        
        // If we get a 404, try falling back to regular NIN verification
        if (error.response?.status === 404) {
          console.log('Combined endpoint not found, falling back to separate verifications...');
          
          // First verify NIN
          const ninResponse = await this.verifyNIN(ninNumber, null, userType, userId);

          if (ninResponse.entity.verified !== true) {
            return ninResponse; // Return NIN verification error
          }
          
          // Then verify Selfie
          const selfieResponse = await this.verifyID(null, selfieImage, 'nin', userType, ninNumber, bvnNumber);
          console.log('Combined verification response:', {
            nin: ninResponse.data,
            idSelfie: selfieResponse.data
          });
          // Combine responses
          return {
            status: selfieResponse.data?.entity.verified,
            message: 'Combined verification process completed',
            data: {
              ...ninResponse.data,
              selfie: selfieResponse.data
            }
          };
        } else {
          throw error;
        }
      }
    } catch (error) {
      throw error.response?.data || { message: 'Complete NIN verification failed' };
    }
  },

  /**
   * Upload ID verification documents
   * @param {string} idImage - Base64 encoded ID image
   * @param {string} selfieImage - Base64 encoded selfie image
   * @param {string} idType - Type of ID document (optional)
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Promise} - API response
   */
  async verifyID(idImage, selfieImage, idType = 'generic', userType = 'caregiver', bvn, nin) {
    try {
      const response = await verificationApi.post('/kyc/verify-id-selfie', { 
        idImage, 
        selfieImage,
        idType,
        userType,
        bvn: this._getTestValue('bvn', bvn),
        nin: this._getTestValue('nin', nin)
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
  async forceVerification() {
    this.saveVerificationStatus(
      true, 
      'verified', 
      'Verification completed successfully (forced)'
    );
    return this._cachedStatus;
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
  saveVerificationStatus(verified = true, status = 'verified', message = '', userId = null, userType = 'caregiver') {
    // Save to cache for the current session
    this._cachedStatus = {
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
   * Save verification data to Azure API
   * @param {object} verificationData - The verification data to save
   * @returns {Promise} - API response
   */
  async saveVerificationData(verificationData) {
    try {


      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Azure API endpoint
      const externalApiUrl = config.BASE_URL.replace('/api', ''); // Using centralized API config
      
      // Choose endpoint based on user type
      const endpoint = verificationData.userType === 'client'
        ? `${externalApiUrl}/api/Verifications`
        : `${externalApiUrl}/api/Verifications`;

        const dataToSave = {
           userId: verificationData.userId,
           verifiedFirstName: verificationData.verifiedFirstName,
           verifiedLastName: verificationData.verifiedLastName,
           verificationMethod: verificationData.verificationMethod,
           verificationNo: verificationData.verificationNo,
           verificationStatus: verificationData.verificationStatus
        }
      
      const response = await axios.post(
        endpoint,
        dataToSave,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Successfully saved verification data to Azure:', response.data);

      return {
        status: 'success',
        message: 'Verification data submitted to Azure successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Failed to submit verification data to Azure:', error);
      
      // Store the failed submission attempt for retry later
      const pendingData = JSON.parse(localStorage.getItem('pendingVerificationData') || '[]');
      if (verificationData && !pendingData.some(data => 
          data.userId === verificationData.userId && 
          data.timestamp === verificationData.timestamp)) {
        pendingData.push(verificationData);
        localStorage.setItem('pendingVerificationData', JSON.stringify(pendingData));
      }
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to submit verification data to Azure. Data stored for later submission.';
      
      if (error.response) {
        // The request was made and the server responded with a status code outside of 2xx
        if (error.response.status === 401) {
          errorMessage = 'Authorization error: Please log in again and retry.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid verification data format. Please try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error: Unable to save verification data at this time. Will retry automatically.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network issue: Unable to connect to verification service. Data will be saved once connectivity is restored.';
      }
      
      return {
        status: 'error',
        message: errorMessage,
        error: error.message,
        originalError: error
      };
    }
  },

  /**
   * Get verification status
   * @param {string} userId - User ID to check verification status
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Promise} - API response with verification status
   */
  async getVerificationStatus(userId, userType,token) {

    token = token || localStorage.getItem('authToken');
    
    // Check if token is expired
    const isTokenExpired = (token) => {
      if (!token) return true;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
      } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
      }
    };

    if (isTokenExpired(token)) {
      const error = new Error('Token expired');
      error.status = 401;
      throw error;
    }

    try {
      // If we have a cached status and it's less than 30 seconds old, return it
      const now = Date.now();
      if (this._cachedStatus && (now - this._lastVerificationRequest) < 30000) {
        return this._cachedStatus;
      }

      const response = await verificationApi.get('/dojah/status', {
        params: { userId, userType, token },
      });

      // Process the enhanced response data from new backend endpoint
      const statusData = response.data.data || response.data;
      
      // Create enhanced status object for frontend use
      const enhancedStatus = {
        // Legacy fields for backward compatibility
        verified: statusData.isVerified || false,
        verificationStatus: statusData.verificationStatus || 'not_verified',
        
        // New enhanced fields
        hasSuccess: statusData.hasSuccess || false,
        hasPending: statusData.hasPending || false,
        hasFailed: statusData.hasFailed || false,
        hasAny: statusData.hasAny || false,
        totalAttempts: statusData.totalAttempts || 0,
        lastAttempt: statusData.lastAttempt,
        needsVerification: statusData.needsVerification || false,
        message: statusData.message || 'No verification status available',
        mostRecentRecord: statusData.mostRecentRecord,
        
        // Current status for UI logic
        currentStatus: statusData.verificationStatus || 'not_verified',
        
        // Legacy methods structure for compatibility
        methods: {
          bvn: { status: statusData.hasSuccess ? 'verified' : 'not_verified' },
          nin: { status: statusData.hasSuccess ? 'verified' : 'not_verified' },
          idSelfie: { status: statusData.hasSuccess ? 'verified' : 'not_verified' }
        }
      };

      this._cachedStatus = enhancedStatus;
      this._lastVerificationRequest = now;
      
      return enhancedStatus;
    } catch (error) {
      console.error('Error getting verification status:', error);
      
      // Handle 401 (unauthorized/expired token)
      if (error.response?.status === 401 || error.status === 401) {
        const authError = new Error('Authentication failed - token expired');
        authError.status = 401;
        throw authError;
      }
      
      // If we got a 404, return enhanced default unverified status
      if (error.response?.status === 404) {
        return {
          // Legacy fields
          verified: false,
          verificationStatus: 'not_verified',
          methods: {
            bvn: { status: 'not_verified' },
            nin: { status: 'not_verified' },
            idSelfie: { status: 'not_verified' }
          },
          // Enhanced fields
          hasSuccess: false,
          hasPending: false,
          hasFailed: false,
          hasAny: false,
          totalAttempts: 0,
          lastAttempt: null,
          needsVerification: true,
          message: 'No verification records found',
          mostRecentRecord: null,
          currentStatus: 'not_verified'
        };
      }
      
      throw error;
    }
  },
  
  /**
   * Get verification status from cache only (no server request)
   * This is useful for components that need to display verification status
   * without triggering an infinite loop of API requests
   * 
   * @param {string} userId - User ID to check verification status
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @returns {Object} - Cached verification status or default unverified status
   */
  getCachedVerificationStatus(userId = null, userType = 'caregiver') {
    try {
      // Try to get user-specific verification status first if userId is provided
      const storageKey = userId 
        ? `verificationStatus_${userType}_${userId}` 
        : 'verificationStatus';
        
      const localStatus = localStorage.getItem(storageKey);
      
      if (localStatus) {
        const parsed = JSON.parse(localStatus);
        return parsed;
      }
      
      // Fall back to general verification status if no user-specific status found
      if (!localStatus && !userId) {
        const generalStatus = localStorage.getItem('verificationStatus');
        if (generalStatus) {
          return JSON.parse(generalStatus);
        }
      }
      
      // If no cached status found, return default unverified status
      return {
        verified: false,
        verificationStatus: 'unverified',
        message: 'No cached verification status available.'
      };
    } catch (err) {
      console.error("Error reading verification status from localStorage", err);
      return {
        verified: false,
        verificationStatus: 'unverified',
        message: 'Error reading cached verification status.'
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
  pollVerificationStatus(callback, intervalMs = 10000, userId = null, userType = 'caregiver') {
    let lastStatus = null;
    let attempts = 0;
    const maxAttempts = 6; // Reduced from 12 to 6 attempts (60 seconds at 10s interval)
    
    const intervalId = setInterval(async () => {
      try {
        attempts++;
        const status = await this.getVerificationStatus(userId, userType);
        
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
  },

  /**
   * Submit verification data to Azure API
   * This function will be used when the Azure API endpoint is available
   * For now, it stores the data and returns success
   * @param {object} verificationData - The verification data to submit
   * @returns {Promise} - API response
   */
  async submitVerificationDataToAzure(verificationData) {
    // Check if we have saved verification data to process
    const pendingData = JSON.parse(localStorage.getItem('pendingVerificationData') || '[]');
    try {
      // For now, since the Azure endpoint is not available, we'll just log the data
      console.log('Would submit verification data to Azure:', verificationData);

      // Build the azureData object to match the required structure
      // {
      //   "userId": "string",
      //   "verifiedFirstName": "string",
      //   "verifiedLastName": "string",
      //   "verificationMethod": "string",
      //   "verificationNo": "string",
      //   "verificationStatus": "string"
      // }
      const azureData = {
        userId: verificationData.userId || '',
        verifiedFirstName: verificationData.verifiedFirstName || verificationData.firstName || '',
        verifiedLastName: verificationData.verifiedLastName || verificationData.lastName || '',
        verificationMethod: verificationData.verificationMethod || verificationData.method || '',
        verificationNo: verificationData.verificationNo || verificationData.bvnNumber || verificationData.ninNumber || '',
        verificationStatus: verificationData.verificationStatus || verificationData.status || ''
      };

      const externalApiUrl = config.BASE_URL.replace('/api', ''); // Using centralized API config
      const endpoint = `${externalApiUrl}/api/Verifications`;

      const response = await axios.post(
        endpoint,
        azureData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: 'success',
        message: 'Verification data submitted to Azure successfully',
        data: response.data
      };
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
   * Submit BVN verification with selfie only
   * @param {string} bvnNumber - The BVN number
   * @param {string} selfieImage - Base64 encoded selfie image
   * @param {string} userType - Type of user ('caregiver' or 'client')
   * @param {string} id - User ID for validation
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async verifyBVNWithSelfie(bvnNumber, selfieImage, userType, id, token) {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      if (!userType) {
        userType = userDetails.userType || 'caregiver';
      }

      // Input validation
      if (!bvnNumber) {
        throw new Error('BVN number is required for verification');
      }
      if (!selfieImage) {
        throw new Error('Selfie image is required for BVN + selfie verification');
      }
      if (id && id !== userDetails.id) {
        throw new Error('User ID mismatch. Please check your authentication details.');
      }

      // Use test BVN if in development mode
      const bvnToSend = this._getTestValue('bvn', bvnNumber);
      console.log('[verificationService] verifyBVNWithSelfie - BVN to send:', bvnToSend);

      const payload = {
        bvnNumber: bvnToSend,
        selfieImage,
        userType,
        id: userDetails.id,
        token
      };

      console.log('[verificationService] verifyBVNWithSelfie - sending payload:', {
        ...payload,
        selfieImage: payload.selfieImage ? 'base64_image_data' : null
      });

      const response = await verificationApi.post('/api/kyc/verify-bvn-with-selfie', payload);
      console.log('[verificationService] verifyBVNWithSelfie - response:', response.data);

      return response.data;

    } catch (error) {
      console.error('Error in BVN with selfie verification:', error);
      throw error.response?.data || { 
        message: error.message || 'BVN with selfie verification failed'
      };
    }
  },

  /**
   * Process Dojah verification results and save to backend
   * @param {Object} verificationPayload - The verification data from Dojah
   * @returns {Promise<Object>} - Response from backend
   */
  async processDojahVerification(verificationPayload) {
    try {
      console.log('[verificationService] processDojahVerification - payload:', verificationPayload);

      // Validate required Azure backend format fields
      if (!verificationPayload.userId || !verificationPayload.verifiedFirstName || !verificationPayload.verifiedLastName) {
        throw new Error('userId, verifiedFirstName, and verifiedLastName are required for Azure API');
      }

      // For verificationMethod and verificationStatus - these cannot be undefined/null
      if (!verificationPayload.verificationMethod || !verificationPayload.verificationStatus) {
        throw new Error('verificationMethod and verificationStatus are required for Azure API');
      }

      // verificationNo can be empty string but should be defined (not null/undefined)
      if (verificationPayload.verificationNo === undefined || verificationPayload.verificationNo === null) {
        throw new Error('verificationNo must be defined (can be empty string) for Azure API');
      }

      // Send the verification data directly to Azure API (not through local Node API)
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token missing for Azure API');
      }

      const response = await axios.post(`${config.BASE_URL}/Verifications`, verificationPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[verificationService] processDojahVerification - Azure API response:', response.data);

      // Handle different verification statuses
      const status = verificationPayload.verificationStatus;
      if (status === 'verified') {
        // Save verification status locally for verified users
        this.saveVerificationStatus(
          true,
          'verified',
          'Dojah KYC verification completed successfully',
          verificationPayload.userId,
          'caregiver'
        );
      } else if (status === 'pending') {
        // Save pending status locally
        this.saveVerificationStatus(
          false,
          'pending',
          'Dojah KYC verification submitted for review',
          verificationPayload.userId,
          'caregiver'
        );
      }

      return {
        success: true,
        message: response.data?.message || 'Verification data saved successfully',
        data: response.data,
        status: status
      };

    } catch (error) {
      console.error('Error processing Dojah verification:', error);
      return { 
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to process Dojah verification',
        status: 'failed'
      };
    }
  },

  async getVerificationFromAPI(userId) {
    try {
      const response = await axios.get(`${config.BASE_URL}/Verifications/userId?userId=${userId}`);
      console.log('[verificationService] getVerificationFromAPI - response:', response.data);
      return response.data.verificationStatus;
    } catch (error) {
      console.error('Error fetching verification data:', error);
      throw error.response?.data || {
        message: error.message || 'Failed to fetch verification data'
      };
    }
  }

};

export default verificationService;
