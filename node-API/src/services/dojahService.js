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
    // Always use mock in development environments or if credentials are missing
    this.useMock = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_VERIFICATION === 'true' || !this.apiKey || !this.appId;
    
    // Define standard test values that should always return verified
    this.testValues = {
      bvn: '22222222222',  // From Dojah API guide
      nin: '70123456789'   // From Dojah API guide
    };
  }
  
  // Helper method to check if a value matches test credentials
  isTestValue(type, value) {
    if (!value) return false;
    
    const testValue = this.testValues[type.toLowerCase()];
    return testValue && testValue === value;
  }

  async verifyNIN(ninNumber, selfieImage = null) {
    // Only return hardcoded response for test NIN
    const isTestNIN = this.isTestValue('nin', ninNumber);
    if (isTestNIN) {
      console.log(`🧪 Always verifying test NIN: ${ninNumber}`);
      return {
        entity: {
          first_name: "John",
          last_name: "Doe",
          middle_name: "Chinwe",
          gender: "M",
          image: "/9j/4AAQScXJSgBBAgAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwg...",
          phone_number: "0812345678",
          date_of_birth: "1993-05-06",
          nin: this.testValues.nin,
          selfie_verification: selfieImage ? {
            confidence_value: 99.90354919433594,
            match: true
          } : undefined,
          verification_status: "success",
          verified: true
        },
        status: true
      };
    }

    // For all other NINs, always call the real Dojah API
    try {
      let response;

      if (selfieImage) {
        response = await axios.post(`${this.baseUrl}/kyc/nin/verify`, {
          nin: ninNumber,
          selfie_image: selfieImage
        }, {
          headers: this.headers
        });
      } else {
        response = await axios.get(`${this.baseUrl}/kyc/nin`, {
          params: { nin: ninNumber },
          headers: this.headers
        });
      }

      if (response.data && response.data.entity) {
        const result = response.data;
        if (selfieImage && result.entity.selfie_verification) {
          result.entity.verified = result.entity.selfie_verification.match === true;
          result.entity.verification_status = result.entity.verified ? "success" : "failed";
        }
        return result;
      } else {
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

  async verifyBVN(bvnNumber, selfieImage = null) {
    // Only return hardcoded response for test BVN
    const isTestBVN = this.isTestValue('bvn', bvnNumber);
    if (isTestBVN) {
      console.log(`🧪 Always verifying test BVN: ${bvnNumber}`);
      return {
        entity: {
          bvn: this.testValues.bvn,
          first_name: "JOHN",
          middle_name: "ANON",
          last_name: "DOE",
          date_of_birth: "01-January-1907",
          phone_number1: "08103817187",
          gender: "Male",
          selfie_verification: selfieImage ? {
            confidence_value: 99.99620056152344,
            match: true
          } : undefined,
          verification_status: "success",
          verified: true
        },
        status: true
      };
    }

    // For all other BVNs, always call the real Dojah API
    try {
      let response;

      if (selfieImage) {
        response = await axios.post(`${this.baseUrl}/kyc/bvn/verify`, {
          bvn: bvnNumber,
          selfie_image: selfieImage
        }, {
          headers: this.headers
        });
      } else {
        response = await axios.get(`${this.baseUrl}/kyc/bvn`, {
          params: { bvn: bvnNumber },
          headers: this.headers
        });
      }

      if (response.data && response.data.entity) {
        const result = response.data;
        if (selfieImage && result.entity.selfie_verification) {
          result.entity.verified = result.entity.selfie_verification.match === true;
          result.entity.verification_status = result.entity.verified ? "success" : "failed";
        }
        return result;
      } else {
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

  async verifyIdWithSelfie(selfieImage, idImage, idType = 'generic', referenceId = null) {
    // If using mock data or missing API credentials, return mock response
    if (this.useMock) {
      console.log('Using mock ID with Selfie verification for testing');
      
      // Mock failure for very small images (likely invalid)
      if (!selfieImage || !idImage || selfieImage.length < 100 || idImage.length < 100) {
        return mockVerifications.mockFailedIdSelfie();
      }
      
      return mockVerifications.mockSuccessIdSelfie();
    }
    
    try {
      // Determine which Dojah endpoint to use based on ID type
      let endpoint = `${this.baseUrl}/kyc/id`;
      let payload = {
        selfie_image: selfieImage,
        id_image: idImage
      };
      
      // Add reference ID if provided for tracking webhook callbacks
      if (referenceId) {
        payload.reference_id = referenceId;
      }
      
      // Make the actual API call to Dojah
      const response = await axios.post(
        endpoint,
        payload,
        { headers: this.headers }
      );
      
      // Check if we got a proper response
      if (response.data && response.data.entity) {
        const result = response.data;
        
        // Add verification status if not already present
        if (!result.entity.verification_status) {
          const isVerified = result.entity.selfie_verification && 
                            result.entity.selfie_verification.match === true;
          result.entity.verified = isVerified;
          result.entity.verification_status = isVerified ? "success" : "failed";
        }
        
        return result;
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
      console.error('ID with Selfie verification error:', error.response?.data || error.message);
      
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
