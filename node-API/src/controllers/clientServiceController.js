const ClientServiceRequest = require('../models/clientServiceRequestModel');
const ProviderService = require('../models/providerServiceModel');
const Gig = require('../models/gigModel');
const User = require('../models/userModel');
const { 
  analyzeClientServiceRequest,
  findMatchingProviders,
  generatePriorityRecommendations 
} = require('../services/clientAiService');

/**
 * Create a new service request
 */
const createServiceRequest = async (req, res) => {
  try {
    // Get client ID from authenticated user
    const clientId = req.user._id;
    
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

    // Create the initial service request
    const serviceRequest = new ClientServiceRequest(serviceRequestData);
    
    // Use AI to analyze the service request
    try {
      const analysis = await analyzeClientServiceRequest({
        title: serviceRequest.title,
        description: serviceRequest.description
      });
      
      // Add AI analysis to the service request
      serviceRequest.requiredProviderTypes = analysis.requiredProviderTypes;
      serviceRequest.serviceTags = analysis.serviceTags;
      serviceRequest.serviceBreakdown = analysis.serviceBreakdown;
      serviceRequest.aiAnalysis = {
        rawAnalysis: analysis.rawAnalysis,
        confidenceScore: analysis.confidenceScore,
        notesForClient: analysis.notesForClient,
        notesForProvider: analysis.notesForProvider
      };
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Continue without AI analysis if it fails
    }

    // Save the service request
    await serviceRequest.save();

    // Find matching providers
    const matchedProviders = await findMatchingProviders(serviceRequest);
    
    if (matchedProviders && matchedProviders.length > 0) {
      // Generate priority recommendations
      const priorityRecommendations = generatePriorityRecommendations(matchedProviders);
      
      // Update the service request with matched providers
      serviceRequest.matchedProviders = priorityRecommendations.map(item => ({
        provider: item.provider._id,
        matchScore: item.matchScore,
        priority: item.priority,
        status: 'recommended'
      }));
      
      await serviceRequest.save();
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
    const clientId = req.user._id;
    
    // Find all service requests for this client
    const serviceRequests = await ClientServiceRequest.find({ client: clientId })
      .sort({ createdAt: -1 })
      .select('-aiAnalysis.rawAnalysis'); // Exclude raw analysis to reduce payload size
    
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
    const userId = req.user._id;
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only allow clients to view their own requests,
    // or providers to see requests that have matched them
    const isOwner = serviceRequest.client.equals(userId);
    const isMatchedProvider = req.user.role === 'caregiver' && 
      serviceRequest.matchedProviders.some(match => match.provider.equals(userId));
      
    if (!isOwner && !isMatchedProvider && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this service request'
      });
    }
    
    // If it's a provider viewing, populate client info but remove sensitive data
    if (isMatchedProvider) {
      await serviceRequest.populate({
        path: 'client',
        select: 'firstName lastName'
      });
    }
    
    // If it's the client viewing, populate provider info
    if (isOwner && serviceRequest.matchedProviders.length > 0) {
      await serviceRequest.populate({
        path: 'matchedProviders.provider',
        select: 'firstName lastName profileStatus verificationStatus'
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
    const clientId = req.user._id;
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can update it
    if (!serviceRequest.client.equals(clientId)) {
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
    const allowedFields = [
      'title', 'description', 'location', 'maxDistance', 
      'serviceDate', 'budget', 'status'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        serviceRequest[field] = req.body[field];
      }
    });
    
    // If description or title changed, re-run AI analysis
    if (req.body.description !== undefined || req.body.title !== undefined) {
      try {
        const analysis = await analyzeClientServiceRequest({
          title: serviceRequest.title,
          description: serviceRequest.description
        });
        
        // Update with new AI analysis
        serviceRequest.requiredProviderTypes = analysis.requiredProviderTypes;
        serviceRequest.serviceTags = analysis.serviceTags;
        serviceRequest.serviceBreakdown = analysis.serviceBreakdown;
        serviceRequest.aiAnalysis = {
          rawAnalysis: analysis.rawAnalysis,
          confidenceScore: analysis.confidenceScore,
          notesForClient: analysis.notesForClient,
          notesForProvider: analysis.notesForProvider
        };
        
        // Find matching providers again based on new analysis
        const matchedProviders = await findMatchingProviders(serviceRequest);
        
        if (matchedProviders && matchedProviders.length > 0) {
          // Generate priority recommendations
          const priorityRecommendations = generatePriorityRecommendations(matchedProviders);
          
          // Update the service request with matched providers
          serviceRequest.matchedProviders = priorityRecommendations.map(item => ({
            provider: item.provider._id,
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
    
    // Save the updated request
    await serviceRequest.save();
    
    res.status(200).json({
      status: 'success',
      data: serviceRequest,
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
    const userId = req.user._id;
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can cancel it
    if (!serviceRequest.client.equals(userId) && req.user.role !== 'admin') {
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
    
    // Update status to cancelled
    serviceRequest.status = 'cancelled';
    await serviceRequest.save();
    
    // If there are any active gigs for this request, cancel those as well
    await Gig.updateMany(
      { 
        serviceRequest: requestId,
        status: { $in: ['accepted', 'in_progress'] }
      },
      { status: 'cancelled' }
    );
    
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
    const clientId = req.user._id;
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can view matches
    if (!serviceRequest.client.equals(clientId) && req.user.role !== 'admin') {
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
        
        // Update the service request with matched providers
        serviceRequest.matchedProviders = priorityRecommendations.map(item => ({
          provider: item.provider._id,
          matchScore: item.matchScore,
          priority: item.priority,
          status: 'recommended'
        }));
        
        await serviceRequest.save();
      }
    }
    
    // Populate provider details
    await serviceRequest.populate({
      path: 'matchedProviders.provider',
      select: 'firstName lastName role profileStatus verificationStatus'
    });
    
    // Get provider service details for each match
    const providerIds = serviceRequest.matchedProviders.map(match => match.provider._id);
    const providerServices = await ProviderService.find({
      provider: { $in: providerIds }
    });
    
    // Merge provider service details with matches
    const enrichedMatches = serviceRequest.matchedProviders.map(match => {
      const providerService = providerServices.find(ps => 
        ps.provider.toString() === match.provider._id.toString()
      );
      
      return {
        ...match.toObject(),
        providerDetails: providerService || null
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        serviceRequest: {
          _id: serviceRequest._id,
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
    const clientId = req.user._id;
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Security check: Only the client who created the request can select a provider
    if (!serviceRequest.client.equals(clientId)) {
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
      match => match.provider.toString() === providerId
    );
    
    if (!matchedProvider) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider not found in the matched providers list'
      });
    }
    
    // Update the provider's status to accepted
    matchedProvider.status = 'accepted';
    
    // Update the service request status to matched
    serviceRequest.status = 'matched';
    
    await serviceRequest.save();
    
    // Create a new gig for this match
    const provider = await User.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Selected provider not found'
      });
    }
    
    // Create the gig with initial task breakdown from service request
    const newGig = new Gig({
      serviceRequest: serviceRequest._id,
      provider: providerId,
      client: clientId,
      taskBreakdown: serviceRequest.serviceBreakdown.map(task => ({
        task: task.task,
        description: task.description,
        status: 'pending'
      }))
    });
    
    // Add scheduled times based on service date
    if (serviceRequest.serviceDate) {
      newGig.scheduledTimes.push({
        startTime: serviceRequest.serviceDate.startDate,
        endTime: serviceRequest.serviceDate.endDate || new Date(serviceRequest.serviceDate.startDate.getTime() + (2 * 60 * 60 * 1000)), // Default 2 hours if no end date
        status: 'scheduled'
      });
    }
    
    await newGig.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Provider selected and gig created successfully',
      data: {
        serviceRequest: serviceRequest._id,
        gig: newGig._id,
        provider: {
          id: provider._id,
          name: `${provider.firstName} ${provider.lastName}`
        }
      }
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
    const providerId = req.user._id;
    
    // Find all service requests where this provider is matched
    const serviceRequests = await ClientServiceRequest.find({
      'matchedProviders.provider': providerId,
      status: { $in: ['open', 'matched'] } // Only get active requests
    })
    .select('-aiAnalysis.rawAnalysis')
    .populate({
      path: 'client',
      select: 'firstName lastName'
    });
    
    // For each service request, determine if this provider has been selected
    const enrichedRequests = serviceRequests.map(request => {
      const providerMatch = request.matchedProviders.find(
        match => match.provider.toString() === providerId.toString()
      );
      
      return {
        _id: request._id,
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
    const providerId = req.user._id;
    
    // Validate response
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid response. Must be either "accept" or "decline"'
      });
    }
    
    // Find the service request
    const serviceRequest = await ClientServiceRequest.findById(requestId);
    
    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }
    
    // Check if the provider is in the matched providers list
    const matchIndex = serviceRequest.matchedProviders.findIndex(
      match => match.provider.toString() === providerId.toString()
    );
    
    if (matchIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'You are not matched with this service request'
      });
    }
    
    // Update the provider's status based on response
    serviceRequest.matchedProviders[matchIndex].status = response === 'accept' ? 'accepted' : 'declined';
    
    // Add feedback if provided
    if (feedback) {
      serviceRequest.matchedProviders[matchIndex].feedback = feedback;
    }
    
    await serviceRequest.save();
    
    // If the provider accepted and the service request status is still open,
    // create a provisional gig that's pending client confirmation
    if (response === 'accept' && serviceRequest.status === 'open') {
      // Check if a gig already exists
      const existingGig = await Gig.findOne({
        serviceRequest: requestId,
        provider: providerId
      });
      
      if (!existingGig) {
        // Create a new gig with provisional status
        const newGig = new Gig({
          serviceRequest: serviceRequest._id,
          provider: providerId,
          client: serviceRequest.client,
          status: 'provisional', // This is a custom status we need to add to the gigModel
          taskBreakdown: serviceRequest.serviceBreakdown.map(task => ({
            task: task.task,
            description: task.description,
            status: 'pending'
          })),
          notes: [{
            author: providerId,
            text: 'Provider has accepted the service request match. Waiting for client confirmation.',
            createdAt: new Date()
          }]
        });
        
        // Add scheduled times based on service date
        if (serviceRequest.serviceDate) {
          newGig.scheduledTimes.push({
            startTime: serviceRequest.serviceDate.startDate,
            endTime: serviceRequest.serviceDate.endDate || new Date(serviceRequest.serviceDate.startDate.getTime() + (2 * 60 * 60 * 1000)), // Default 2 hours if no end date
            status: 'scheduled'
          });
        }
        
        await newGig.save();
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: `Service request ${response === 'accept' ? 'accepted' : 'declined'} successfully`,
      data: {
        serviceRequestId: serviceRequest._id,
        matchStatus: response === 'accept' ? 'accepted' : 'declined'
      }
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
