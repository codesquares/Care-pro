const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

/**
 * Gets user verification status for the Azure API
 * This endpoint allows the external Azure API to check a user's
 * verification status and results
 */
const getUserVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }
    
    // Get verification status from external API
    const response = await axios.get(`${External_API}/users/${userId}/verification-status`, {
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${process.env.INTERNAL_API_KEY}`
      }
    });
    
    if (!response.data?.data) {
      return res.status(404).json({
        status: 'error',
        message: 'Verification status not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: response.data.data
    });
  } catch (error) {
    console.error('Get user verification status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting user verification status',
      error: error.message
    });
  }
};

/**
 * Get provider service data for a provider for the Azure API
 */
const getProviderServiceData = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    if (!providerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Provider ID is required'
      });
    }
    
    // Get provider service data from external API
    const response = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${process.env.INTERNAL_API_KEY}`
      }
    });
    
    const providerService = response.data?.data?.[0];
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: providerService
    });
  } catch (error) {
    console.error('Get provider service data error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting provider service data',
      error: error.message
    });
  }
};

/**
 * Get all client service requests for a specific client
 */
const getClientServiceRequests = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Client ID is required'
      });
    }
    
    // Get client service requests from external API
    const response = await axios.get(`${External_API}/client-service-requests?clientId=${clientId}`, {
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${process.env.INTERNAL_API_KEY}`
      }
    });
    
    return res.status(200).json({
      status: 'success',
      results: response.data?.data?.length || 0,
      data: response.data?.data || []
    });
  } catch (error) {
    console.error('Get client service requests error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting client service requests',
      error: error.message
    });
  }
};

module.exports = {
  getUserVerificationStatus,
  getProviderServiceData,
  getClientServiceRequests
};
