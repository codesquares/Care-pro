// This file is for setting up the Dojah service
// Dojah is an identity verification platform for Africa
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// Import mock verification responses for testing
const mockVerifications = require('./mockVerificationService');

class DojahService {
  constructor() {
    this.apiKey = process.env.DOJAH_API_KEY;
    this.appId = process.env.DOJAH_APP_ID;
    this.baseUrl = 'https://api.dojah.io/api/v1';
    this.headers = {
      'Authorization': `${this.apiKey}`,
      'AppId': `${this.appId}`,
      'Content-Type': 'application/json'
    };
    this.useMock = process.env.USE_MOCK_VERIFICATION === 'true' || !this.apiKey || !this.appId;
  }

  async verifyNIN(ninNumber) {
    // If using mock data or missing API credentials, return mock response
    if (this.useMock) {
      console.log('Using mock NIN verification for testing');
      // Mock failure for some specific test values, success for others
      if (ninNumber === '12345678900' || ninNumber.length !== 11) {
        return mockVerifications.mockFailedNIN(ninNumber);
      }
      return mockVerifications.mockSuccessNIN(ninNumber);
    }
    
    try {
      // Make the actual API call to Dojah
      const response = await axios.get(`${this.baseUrl}/kyc/nin`, {
        params: { nin: ninNumber },
        headers: this.headers
      });
      
      // Check if we got a proper response
      if (response.data && response.data.entity) {
        return response.data;
      } else {
        // Invalid response format
        return {
          entity: {
            nin: ninNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid response from verification service"
          },
          status: false
        };
      }
    } catch (error) {
      console.error('NIN verification error:', error.response?.data || error.message);
      
      // Check if it's a validation error (invalid NIN)
      if (error.response && error.response.status === 400) {
        return {
          entity: {
            nin: ninNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid NIN provided. Please check and try again."
          },
          status: false
        };
      }
      
      // Server or API error
      return {
        entity: {
          nin: ninNumber,
          verification_status: "error",
          verified: false,
          message: "Verification service temporarily unavailable. Please try again later."
        },
        status: false,
        error: error.message
      };
    }
  }

  async verifyBVN(bvnNumber) {
    // If using mock data or missing API credentials, return mock response
    if (this.useMock) {
      console.log('Using mock BVN verification for testing');
      // Mock failure for some specific test values, success for others
      if (bvnNumber === '12345678900' || bvnNumber.length !== 11) {
        return mockVerifications.mockFailedBVN(bvnNumber);
      }
      return mockVerifications.mockSuccessBVN(bvnNumber);
    }
    
    try {
      // Make the actual API call to Dojah
      const response = await axios.get(`${this.baseUrl}/kyc/bvn`, {
        params: { bvn: bvnNumber },
        headers: this.headers
      });
      
      // Check if we got a proper response
      if (response.data && response.data.entity) {
        return response.data;
      } else {
        // Invalid response format
        return {
          entity: {
            bvn: bvnNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid response from verification service"
          },
          status: false
        };
      }
    } catch (error) {
      console.error('BVN verification error:', error.response?.data || error.message);
      
      // Check if it's a validation error (invalid BVN)
      if (error.response && error.response.status === 400) {
        return {
          entity: {
            bvn: bvnNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid BVN provided. Please check and try again."
          },
          status: false
        };
      }
      
      // Server or API error
      return {
        entity: {
          bvn: bvnNumber,
          verification_status: "error",
          verified: false,
          message: "Verification service temporarily unavailable. Please try again later."
        },
        status: false,
        error: error.message
      };
    }
  }

  async verifySelfieToDocs(selfieImage, idImage) {
    // If using mock data or missing API credentials, return mock response
    if (this.useMock) {
      console.log('Using mock ID & Selfie verification for testing');
      
      // Mock failure for very small images (likely invalid)
      if (!selfieImage || !idImage || selfieImage.length < 100 || idImage.length < 100) {
        return mockVerifications.mockFailedIdSelfie();
      }
      
      return mockVerifications.mockSuccessIdSelfie();
    }
    
    try {
      // Make the actual API call to Dojah
      const response = await axios.post(
        `${this.baseUrl}/kyc/selfie-bvn-verification`,
        {
          selfie_image: selfieImage,
          id_image: idImage
        },
        { headers: this.headers }
      );
      
      // Check if we got a proper response
      if (response.data && response.data.entity) {
        return response.data;
      } else {
        // Invalid response format
        return {
          entity: {
            verification_status: "failed",
            verified: false,
            message: "Invalid response from verification service"
          },
          status: false
        };
      }
    } catch (error) {
      console.error('Selfie verification error:', error.response?.data || error.message);
      
      // Check if it's a validation error (invalid images)
      if (error.response && error.response.status === 400) {
        return {
          entity: {
            verification_status: "failed",
            verified: false,
            message: "Invalid image data provided. Please ensure your ID and selfie are clear and properly formatted."
          },
          status: false
        };
      }
      
      // Server or API error
      return {
        entity: {
          verification_status: "error",
          verified: false,
          message: "Verification service temporarily unavailable. Please try again later."
        },
        status: false,
        error: error.message
      };
    }
  }

  async verifyAddress(address) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/kyc/address`,
        address,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Address verification error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
    }
  }

  async createVerificationSession() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/kyc/widget/user`,
        {
          verification_type: "FULL", // Options: FULL, BASIC, etc.
          redirect_url: "http://localhost:3000/verification-complete", // Update with your app's URL
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Widget creation error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
    }
  }

  async getVerificationStatus(referenceId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/kyc/lookup`,
        {
          params: { reference_id: referenceId },
          headers: this.headers
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Verification status error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
    }
  }
}

module.exports = new DojahService();
