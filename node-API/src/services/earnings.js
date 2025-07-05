// src/services/earnings.js
const axios = require('axios');
require('dotenv').config();

/**
 * Handles a caregiver's earnings requests
 * 
 * @param {Object} earningsRequest - The caregiver's earnings service request object
 * @returns {Promise<Object>} 
 */
const generateEarnings = async (earningsRequest) => {
  try {
    const { caregiverId, totalEarned, token } = earningsRequest;
    const dataToSend = {
      caregiverId,
      totalEarned
    }
    
    const result = await axios.post(
      'https://carepro-api20241118153443.azurewebsites.net/api/Earnings',
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const response = result.data;

    return response;
  } catch (error) {
    console.error('Earnings service error:', error.message);
    // Return a minimal default response
    throw new Error(`Failed to generate earnings: ${error.message}`);
  }
};

module.exports = {
  generateEarnings
}