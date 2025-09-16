// src/services/earnings.js
const axios = require('axios');
require('dotenv').config();

/**
 * Handles a caregiver's earnings requests
 * 
 * @param {Object} withdrawalRequest - The caregiver's withdrawal service request object
 * @returns {Promise<Object>} 
 */
const generateWithdrawalRequest = async (withdrawalRequest) => {
  try {
    const { caregiverId, amountRequested, accountNumber, bankName, accountName, token } = withdrawalRequest;

    const dataToSend = {
      caregiverId,
      amountRequested,
      accountNumber,
      bankName,
      accountName
    };

    console.log('Sending to API:', dataToSend);

    const result = await axios.post(
      'https://carepro-api20241118153443.azurewebsites.net/api/WithdrawalRequests',
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const response = result.data; // ✅ correct

    return response;
  } catch (error) {
    console.error('Withdrawal service error:', {
      message: error.message,
      data: error.response?.data,
      status: error.response?.status
    });

    throw new Error(
      error.response?.data?.errorMessage || 'Failed to generate withdrawal'
    );
  }
};


module.exports = {
  generateWithdrawalRequest
}