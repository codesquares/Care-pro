// This file is for setting up the Dojah service
// Dojah is an identity verification platform for Africa
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

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
  }

  async verifyNIN(ninNumber) {
    try {
      const response = await axios.get(`${this.baseUrl}/kyc/nin`, {
        params: { nin: ninNumber },
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('NIN verification error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
    }
  }

  async verifyBVN(bvnNumber) {
    try {
      const response = await axios.get(`${this.baseUrl}/kyc/bvn`, {
        params: { bvn: bvnNumber },
        headers: this.headers
      });
      
      return response.data;
    } catch (error) {
      console.error('BVN verification error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
    }
  }

  async verifySelfieToDocs(selfieImage, idImage) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/kyc/selfie-bvn-verification`,
        {
          selfie_image: selfieImage,
          id_image: idImage
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Selfie verification error:', error.response?.data || error.message);
      throw new Error(`Dojah API error: ${error.message}`);
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
