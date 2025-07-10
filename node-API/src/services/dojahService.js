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
    // Define standard test values that should always return verified
    this.testValues = {
      bvn: '22222222222',  // From Dojah API guide
      nin: '70123456789'   // From Dojah API guide
    };
  }
  // // For all other NINs, always call the real Dojah API
    // Base64 value of the selfie image NB: Kindly truncate data:image/jpeg;base64, from the selfie_image object and pass only the buffer starting with /9.
   

  // Helper method to check if a value matches test credentials
  isTestValue(type, value) {
    if (!value) return false;
    
    const testValue = this.testValues[type.toLowerCase()];
    return testValue && testValue === value;
  }

  async verifyNIN(ninNumber, selfie_image = null) {
    // Log the value received and test check
     const selfieBuffer = selfie_image ? selfie_image.split(',')[1] : null;
    console.log('[DojahService] verifyNIN called with:', ninNumber);
    const isTestNIN = this.isTestValue('nin', ninNumber);
    console.log('[DojahService] isTestValue("nin", value):', isTestNIN);
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

   
    try {
      let response;

      if (selfie_image) {
        response = await axios.post(`${this.baseUrl}/kyc/nin/verify`, {
          nin: ninNumber,
          selfie_image: selfie_image
        }, {
          headers: this.headers
        });
      } else {
        response = await axios.get(`${this.baseUrl}/kyc/nin`, {
          params: { nin: ninNumber },
          headers: this.headers
        });
      }

      if (response.data && response.data.entity) {// Check if the response contains the expected entity
        const result = response.data;
        if (selfie_image && result.entity.selfie_verification) {
          const isVerified = result.entity.selfie_verification.match;
          const verificationStatus = isVerified ? "success" : "failed";
          result.entity.verified = isVerified;
          result.entity.verification_status = verificationStatus;
        }
        return result;
      } else {// If the response does not contain the expected entity
        console.error('Invalid response format:', response.data);
        // Return a structured error response
        return {
          entity: {
            nin: ninNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid response from verification service"
          },
          // status: false
        };
      }
    } catch (error) {// Error handling for NIN verification
      // Log the error details for debugging
      console.error('NIN verification error:', error.response?.data || error.message);
      if (error.response && error.response.status === 400) {
        return {
          entity: {
            nin: ninNumber,
            verification_status: "failed",
            verified: false,
            message: "Invalid NIN provided. Please check and try again."
          },
          // status: false
        };
      }
      return {// Error handling for NIN verification
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

  async verifyBVN(bvnNumber, selfie_image = null) {
    // Log the value received and test check
    const selfieBuffer = selfie_image ? selfie_image.split(',')[1] : null;
    console.log('[DojahService] verifyBVN called with:', bvnNumber);
    const isTestBVN = this.isTestValue('bvn', bvnNumber);
    console.log('[DojahService] isTestValue("bvn", value):', isTestBVN);
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

      if (selfie_image) {
        response = await axios.post(`${this.baseUrl}/kyc/bvn/verify`, {
          bvn: bvnNumber,
          selfie_image: selfie_image
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
        if (selfie_image && result.entity.selfie_verification) {
          const isVerified = result.entity.selfie_verification.match;
          const verificationStatus = isVerified ? "success" : "failed";
          result.entity.verified = isVerified;
          result.entity.verification_status = verificationStatus;
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
          // status: false
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
          // status: false
        };
      }
      return {
        entity: {
          bvn: bvnNumber,
          verification_status: "error",
          verified: false,
          message: "Verification service temporarily unavailable. Please try again later."
        },
        // status: false,
        error: error.message
      };
    }
  }

  async verifySelfieToDocs(selfie_image, photoid_image) {
    // No more mock: always proceed to real verification
    const selfieBuffer = selfie_image ? selfie_image.split(',')[1] : null;

    try {
      // Make the actual API call to Dojah
      const response = await axios.post(
        `${this.baseUrl}/kyc/selfie-bvn-verification`,
        {
          selfie_image: selfie_image,
          photoid_image: photoid_image
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

  async verifyIdWithSelfie(selfie_image, photoid_image, referenceId, first_name, last_name, bvn, nin) {
     const selfieBuffer = selfie_image ? selfie_image.split(',')[1] : null;
    // No more mock: always proceed to real verification
    try {
      // Determine which Dojah endpoint to use based on ID type
      let endpoint = `${this.baseUrl}/kyc/${bvn ? "bvn" : "nin"}/verify`;
      let payload = {
        selfie_image: selfie_image,
        photoid_image: photoid_image,
        first_name: first_name,
        last_name: last_name,
        bvn: bvn || "",
        nin: nin || ""
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
        if (result.entity && result.entity.selfie_verification && result.entity.selfie_verification.confidence_value >= 90) {
          const isVerified =  result.entity.selfie_verification.match;
          result.entity.verified = isVerified;
          const verificationStatus = isVerified ? "success" : "failed";
          result.entity.verification_status = verificationStatus;
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
          // status: false
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
          // status: false
        };
      }
      
      // Server or API error
      return {
        entity: {
          verification_status: "error",
          verified: false,
          message: "Verification service temporarily unavailable. Please try again later."
        },
        // status: false,
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
          redirect_url: `http://localhost:3000/verification-complete`, // Update with your app's URL
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
