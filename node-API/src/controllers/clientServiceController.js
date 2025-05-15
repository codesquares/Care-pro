const axios = require('axios');
const { configDotenv } = require('dotenv');
const { 
  analyzeClientServiceRequest,
  findMatchingProviders,
  generatePriorityRecommendations 
} = require('../services/clientAiService');

configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

/**
 * Create a new service request
 */
const createServiceRequest = async (req, res) => {
  try {
    // Get client ID from authenticated user
    const clientId = req.user.id;
    
    // Make sure user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        status: 'error',
        message: 'Only clients can create service requests'
      });
    }
    
    // Create a new request object with client data
    const serviceRequestData = {
      ...req.body,
      client: clientId
    };
    
    // Validate the location data
    if (!serviceRequestData.location || !serviceRequestData.location.coordinates || 
        !Array.isArray(serviceRequestData.location.coordinates) || 
        serviceRequestData.location.coordinates.length !== 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid location coordinates. Please provide [longitude, latitude]'
      });
    }

    // Use AI to analyze the service request
    let analysis = null;
    try {
      analysis = await analyzeClientServiceRequest({
        title: serviceRequestData.title,
        description: serviceRequestData.description
      });
      
      // Add AI analysis to the service request data
      serviceRequestData.requiredProviderTypes = analysis.requiredProviderTypes;
      serviceRequestData.serviceTags = analysis.serviceTags;
      serviceRequestData.serviceBreakdown = analysis.serviceBreakdown;
      serviceRequestData.aiAnalysis = {
        rawAnalysis: analysis.rawAnalysis,
        confidenceScore: analysis.confidenceScore,
        notesForClient: analysis.notesForClient,
        notesForProvider: analysis.notesForProvider
      };
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Continue without AI analysis if it fails
    }

    // Create the service request through the external API
    const response = await axios.post(`${External_API}/client-services`, serviceRequestData, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
        'Content-Type': 'application/json'
      }
    });

    const serviceRequest = response.data;

    // Find matching providers if we have analysis
    if (analysis) {
      const matchedProviders = await findMatchingProviders(serviceRequest);
      
      if (matchedProviders && matchedProviders.length > 0) {
        // Generate priority recommendations
        const priorityRecommendations = generatePriorityRecommendations(matchedProviders);
        
        // Update the service request with matched providers through the external API
        const matchedProvidersData = priorityRecommendations.map(item => ({
          provider: item.provider.id,
          matchScore: item.matchScore,
          priority: item.priority,
          status: 'recommended'
        }));
        
        await axios.patch(`${External_API}/client-services/${serviceRequest.id}/matched-providers`, 
          { matchedProviders: matchedProvidersData },
          {
            headers: {
              'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    
    res.status(201).json({
      status: 'success',
      data: serviceRequest,
      matchCount: serviceRequest.matchedProviders ? serviceRequest.matchedProviders.length : 0
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the service request',
      error: error.message
    });
  }
};

/**
 * Get all service requests for the authenticated client
 */
const getClientServiceRequests = async (req, res) => {
  try {
    const clientId = req.user.id;
    
    // Fetch all service requests for this client from external API
    const response = await axios.get(`${External_API}/client-services?clientId=${clientId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequests = response.data.data || [];
    
    res.status(200).json({
      status: 'success',
      results: serviceRequests.length,
      data: serviceRequests
    });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching service requests',
      error: error.message
    });
  }
};

/**
 * Get a specific service request by ID
 */
const getServiceRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    // Fetch the service request from external API
    const response = await axios.get(`${External_API}/client-services/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequest = response.data.data;
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only allow clients to view their own requests,
    // or providers to see requests that have matched them
    const isOwner = serviceRequest.client === userId;
    const isMatchedProvider = req.user.role === 'caregiver' && 
      serviceRequest.matchedProviders.some(match => match.provider === userId);
      
    if (!isOwner && !isMatchedProvider && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this service request'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: serviceRequest
    });
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the service request',
      error: error.message
    });
  }
};

/**
 * Update a service request
 */
const updateServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const clientId = req.user.id;
    
    // Fetch the current service request from external API
    const getResponse = await axios.get(`${External_API}/client-services/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequest = getResponse.data.data;
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can update it
    if (serviceRequest.client !== clientId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this service request'
      });
    }
    
    // Don't allow updates if the request is already matched or in progress
    if (['matched', 'in_progress', 'completed'].includes(serviceRequest.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot update a service request that is already ${serviceRequest.status}`
      });
    }
    
    // Apply updates from the request body
    const updateData = {};
    const allowedFields = [
      'title', 'description', 'location', 'maxDistance', 
      'serviceDate', 'budget', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // If description or title changed, re-run AI analysis
    if (req.body.description !== undefined || req.body.title !== undefined) {
      try {
        const analysis = await analyzeClientServiceRequest({
          title: updateData.title || serviceRequest.title,
          description: updateData.description || serviceRequest.description
        });
        
        // Update with new AI analysis
        updateData.requiredProviderTypes = analysis.requiredProviderTypes;
        updateData.serviceTags = analysis.serviceTags;
        updateData.serviceBreakdown = analysis.serviceBreakdown;
        updateData.aiAnalysis = {
          rawAnalysis: analysis.rawAnalysis,
          confidenceScore: analysis.confidenceScore,
          notesForClient: analysis.notesForClient,
          notesForProvider: analysis.notesForProvider
        };
        
        // Find matching providers again based on new analysis
        const matchedProviders = await findMatchingProviders({
          ...serviceRequest,
          ...updateData
        });
        
        if (matchedProviders && matchedProviders.length > 0) {
          // Generate priority recommendations
          const priorityRecommendations = generatePriorityRecommendations(matchedProviders);
          
          // Update the matched providers
          updateData.matchedProviders = priorityRecommendations.map(item => ({
            provider: item.provider.id,
            matchScore: item.matchScore,
            priority: item.priority,
            status: 'recommended'
          }));
        }
      } catch (aiError) {
        console.error('AI analysis error during update:', aiError);
        // Continue without updating AI analysis if it fails
      }
    }
    
    // Update the service request through the external API
    const updateResponse = await axios.patch(`${External_API}/client-services/${requestId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
        'Content-Type': 'application/json'
      }
    });
    
    const updatedServiceRequest = updateResponse.data.data;
    
    res.status(200).json({
      status: 'success',
      data: updatedServiceRequest,
      message: 'Service request updated successfully'
    });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the service request',
      error: error.message
    });
  }
};

/**
 * Cancel a service request
 */
const cancelServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    // Fetch the service request from external API
    const getResponse = await axios.get(`${External_API}/client-services/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequest = getResponse.data.data;
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can cancel it
    if (serviceRequest.client !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to cancel this service request'
      });
    }
    
    // Don't allow cancellation if the request is already completed
    if (serviceRequest.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a completed service request'
      });
    }
    
    // Cancel the service request through the external API
    await axios.patch(`${External_API}/client-services/${requestId}`, 
      { status: 'cancelled' },
      {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are any active gigs for this request, cancel those as well
    if (serviceRequest.hasActiveGigs) {
      await axios.post(`${External_API}/gigs/cancel-by-request/${requestId}`, {}, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
          'Content-Type': 'application/json'
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Service request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel service request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling the service request',
      error: error.message
    });
  }
};

/**
 * Get matched providers for a service request
 */
const getMatchedProviders = async (req, res) => {
  try {
    const { requestId } = req.params;
    const clientId = req.user.id;
    
    // Fetch the service request from external API
    const getResponse = await axios.get(`${External_API}/client-services/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequest = getResponse.data.data;
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can view matches
    if (serviceRequest.client !== clientId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view matches for this service request'
      });
    }
    
    // If no matches found, try to find some
    if (!serviceRequest.matchedProviders || serviceRequest.matchedProviders.length === 0) {
      const matchedProviders = await findMatchingProviders(serviceRequest);
      
      if (matchedProviders && matchedProviders.length > 0) {
        // Generate priority recommendations
        const priorityRecommendations = generatePriorityRecommendations(matchedProviders);
        
        // Update the service request with matched providers through the external API
        const matchedProvidersData = priorityRecommendations.map(item => ({
          provider: item.provider.id,
          matchScore: item.matchScore,
          priority: item.priority,
          status: 'recommended'
        }));
        
        await axios.patch(`${External_API}/client-services/${requestId}/matched-providers`, 
          { matchedProviders: matchedProvidersData },
          {
            headers: {
              'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Refetch the service request to get updated matches
        const updatedResponse = await axios.get(`${External_API}/client-services/${requestId}`, {
          headers: {
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
          }
        });
        
        serviceRequest.matchedProviders = updatedResponse.data.data.matchedProviders;
      }
    }
    
    // Get provider details for each match
    const enrichedMatches = await Promise.all(serviceRequest.matchedProviders.map(async match => {
      try {
        // Get provider service details
        const providerResponse = await axios.get(`${External_API}/providers/${match.provider}`, {
          headers: {
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
          }
        });
        
        const providerServiceResponse = await axios.get(`${External_API}/provider-services?providerId=${match.provider}`, {
          headers: {
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
          }
        });
        
        return {
          ...match,
          provider: providerResponse.data.data,
          providerDetails: providerServiceResponse.data.data[0] || null
        };
      } catch (err) {
        console.error(`Error fetching provider ${match.provider} details:`, err.message);
        return match;
      }
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        serviceRequest: {
          _id: serviceRequest.id,
          title: serviceRequest.title,
          status: serviceRequest.status
        },
        matches: enrichedMatches
      }
    });
  } catch (error) {
    console.error('Get matched providers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching matched providers',
      error: error.message
    });
  }
};

/**
 * Select a provider for a service request
 */
const selectProvider = async (req, res) => {
  try {
    const { requestId, providerId } = req.params;
    const clientId = req.user.id;
    
    // Fetch the service request from external API
    const getResponse = await axios.get(`${External_API}/client-services/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequest = getResponse.data.data;
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can select a provider
    if (serviceRequest.client !== clientId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to select a provider for this request'
      });
    }
    
    // Check if the service request is still open
    if (serviceRequest.status !== 'open') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot select a provider for a service request that is ${serviceRequest.status}`
      });
    }
    
    // Check if the provider is in the matched providers list
    const matchedProvider = serviceRequest.matchedProviders.find(
      match => match.provider === providerId
    );
    
    if (!matchedProvider) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider not found in the matched providers list'
      });
    }
    
    // Update the service request to select the provider through the external API
    const updateResponse = await axios.post(`${External_API}/client-services/${requestId}/select-provider/${providerId}`, {}, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = updateResponse.data.data;
    
    res.status(200).json({
      status: 'success',
      message: 'Provider selected and gig created successfully',
      data: result
    });
  } catch (error) {
    console.error('Select provider error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while selecting the provider',
      error: error.message
    });
  }
};

/**
 * Get service requests for a provider
 */
const getProviderServiceRequests = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    // Fetch all service requests where this provider is matched from external API
    const response = await axios.get(`${External_API}/client-services/provider/${providerId}?status=open,matched`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const serviceRequests = response.data.data || [];
    
    // For each service request, determine if this provider has been selected
    const enrichedRequests = serviceRequests.map(request => {
      const providerMatch = request.matchedProviders.find(
        match => match.provider === providerId
      );
      
      return {
        _id: request.id,
        title: request.title,
        description: request.description,
        location: request.location,
        serviceDate: request.serviceDate,
        requiredProviderTypes: request.requiredProviderTypes,
        serviceTags: request.serviceTags,
        status: request.status,
        matchStatus: providerMatch ? providerMatch.status : 'unknown',
        matchScore: providerMatch ? providerMatch.matchScore : 0,
        client: request.client,
        createdAt: request.createdAt
      };
    });
    
    res.status(200).json({
      status: 'success',
      results: enrichedRequests.length,
      data: enrichedRequests
    });
  } catch (error) {
    console.error('Get provider service requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching service requests',
      error: error.message
    });
  }
};

/**
 * Provider accepts or declines a service request match
 */
const respondToServiceRequestMatch = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response, feedback } = req.body; // response should be 'accept' or 'decline'
    const providerId = req.user.id;
    
    // Validate response
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid response. Must be either "accept" or "decline"'
      });
    }
    
    // Respond to the service request through the external API
    const updateResponse = await axios.post(
      `${External_API}/client-services/${requestId}/respond/${providerId}`,
      { response, feedback },
      {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = updateResponse.data;
    
    res.status(200).json({
      status: 'success',
      message: `Service request ${response === 'accept' ? 'accepted' : 'declined'} successfully`,
      data: result.data
    });
  } catch (error) {
    console.error('Respond to service request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while responding to the service request',
      error: error.message
    });
  }
};

module.exports = {
  createServiceRequest,
  getClientServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest,
  getMatchedProviders,
  selectProvider,
  getProviderServiceRequests,
  respondToServiceRequestMatch
};
