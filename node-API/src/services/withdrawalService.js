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

    console.log('='.repeat(10) + ' WITHDRAWAL SERVICE: Sending to C# API ' + '='.repeat(10));
    console.log('Data to send:', dataToSend);
    console.log('API URL:', 'https://carepro-api20241118153443.azurewebsites.net/api/WithdrawalRequests');

    const result = await axios.post(
      'https://carepro-api20241118153443.azurewebsites.net/api/WithdrawalRequests',
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        validateStatus: function (status) {
          // Accept 200, 201, and other 2xx responses as success
          return status >= 200 && status < 300;
        }
      }
    );

    console.log('='.repeat(10) + ' WITHDRAWAL SERVICE: C# API Response ' + '='.repeat(10));
    console.log('Status:', result.status);
    console.log('Status Text:', result.statusText);
    console.log('Response Data:', result.data);
    console.log('Response Headers:', result.headers);

    // Check if the response indicates success
    if (result.status === 200 || result.status === 201) {
      console.log('✅ Withdrawal request successful');
      return {
        success: true,
        data: result.data,
        status: result.status,
        message: 'Withdrawal request created successfully'
      };
    } else {
      console.log('⚠️ Unexpected status code:', result.status);
      throw new Error(`Unexpected response status: ${result.status}`);
    }

  } catch (error) {
    console.error('=== WITHDRAWAL SERVICE ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      // Create detailed error with response info
      const errorMessage = error.response.data?.errorMessage || 
                          error.response.data?.ErrorMessage || 
                          `API Error: ${error.response.status}`;
      
      const serviceError = new Error(errorMessage);
      serviceError.status = error.response.status;
      serviceError.responseData = error.response.data;
      throw serviceError;
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response from withdrawal API');
      
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};


module.exports = {
  generateWithdrawalRequest
}