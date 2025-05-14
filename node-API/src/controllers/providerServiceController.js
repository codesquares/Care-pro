const ProviderService = require('../models/providerServiceModel');
const ClientServiceRequest = require('../models/clientServiceRequestModel');
const User = require('../models/userModel');
const { findMatchingProviders } = require('../services/clientAiService');

/**
 * Create or update provider service profile
 */
const createOrUpdateProviderService = async (req, res) => {
  try {
    const providerId = req.user._id;
    
    // Check if the user is a caregiver, nurse, doctor, or dietician
    if (!['caregiver', 'nurse', 'doctor', 'dietician'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only healthcare providers can create service profiles'
      });
    }
    
    // Check if provider is verified
    if (!req.user.verificationStatus || 
        !req.user.verificationStatus.qualificationVerified ||
        !req.user.verificationStatus.idVerified) {
      return res.status(403).json({
        status: 'error',
        message: 'You need to complete verification before creating a service profile'
      });
    }
    
    // Check if the provider already has a service profile
    let providerService = await ProviderService.findOne({ provider: providerId });
    
    if (providerService) {
      // Update existing service profile
      const allowedFields = [
        'active', 'serviceTypes', 'serviceDescription', 'skills', 
        'serviceTags', 'availability', 'serviceArea', 'pricing'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          providerService[field] = req.body[field];
        }
      });
      
      // Always set providerType from the user's role
      providerService.providerType = req.user.role;
      
    } else {
      // Create new service profile
      providerService = new ProviderService({
        ...req.body,
        provider: providerId,
        providerType: req.user.role
      });
    }
    
    // Validate serviceArea coordinates
    if (providerService.serviceArea && providerService.serviceArea.center) {
      if (!providerService.serviceArea.center.coordinates || 
          !Array.isArray(providerService.serviceArea.center.coordinates) || 
          providerService.serviceArea.center.coordinates.length !== 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid serviceArea coordinates. Please provide [longitude, latitude]'
        });
      }
    }
    
    // Save the service profile
    await providerService.save();
    
    res.status(200).json({
      status: 'success',
      message: providerService ? 'Service profile updated successfully' : 'Service profile created successfully',
      data: providerService
    });
  } catch (error) {
    console.error('Create/Update provider service error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while saving the service profile',
      error: error.message
    });
  }
};

/**
 * Get provider service profile by ID
 */
const getProviderServiceById = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Find provider service
    const providerService = await ProviderService.findOne({ provider: providerId })
      .populate('provider', 'firstName lastName email role profileStatus verificationStatus');
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Check if the provider is active
    if (!providerService.active && 
        !req.user._id.equals(providerId) && 
        req.user.role !== 'admin') {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found or not active'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: providerService
    });
  } catch (error) {
    console.error('Get provider service error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the provider service',
      error: error.message
    });
  }
};

/**
 * Get authenticated provider's own service profile
 */
const getMyProviderService = async (req, res) => {
  try {
    const providerId = req.user._id;
    
    // Find provider service
    const providerService = await ProviderService.findOne({ provider: providerId });
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'You do not have a service profile yet'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: providerService
    });
  } catch (error) {
    console.error('Get my provider service error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching your service profile',
      error: error.message
    });
  }
};

/**
 * Find providers based on client criteria
 */
const findProviders = async (req, res) => {
  try {
    // Get search criteria from request body
    const { 
      providerType, 
      serviceTypes, 
      location, 
      maxDistance, 
      serviceTags 
    } = req.body;
    
    // Build query object
    const query = { active: true };
    
    // Filter by provider type if specified
    if (providerType) {
      query.providerType = providerType;
    }
    
    // Filter by service types if specified
    if (serviceTypes && serviceTypes.length > 0) {
      query.serviceTypes = { $in: serviceTypes };
    }
    
    // Filter by service tags if specified
    if (serviceTags && serviceTags.length > 0) {
      query.serviceTags = { $in: serviceTags };
    }
    
    // Filter by location if specified
    if (location && location.coordinates && maxDistance) {
      query['serviceArea.center'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }
    
    // Find providers matching the criteria
    const providers = await ProviderService.find(query)
      .populate('provider', 'firstName lastName role profileStatus verificationStatus')
      .sort({ averageRating: -1 })
      .limit(20);
    
    res.status(200).json({
      status: 'success',
      results: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('Find providers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while searching for providers',
      error: error.message
    });
  }
};

/**
 * Update provider availability
 */
const updateAvailability = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { availability } = req.body;
    
    // Validate availability data
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid availability data'
      });
    }
    
    // Find provider service
    const providerService = await ProviderService.findOne({ provider: providerId });
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Update availability
    providerService.availability = {
      ...providerService.availability,
      ...availability
    };
    
    await providerService.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Availability updated successfully',
      data: providerService.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating availability',
      error: error.message
    });
  }
};

/**
 * Add a review for a provider
 */
const addProviderReview = async (req, res) => {
  try {
    const { providerId } = req.params;
    const clientId = req.user._id;
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    // Find the provider service
    const providerService = await ProviderService.findOne({ provider: providerId });
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Check if client has worked with this provider before
    const hasWorkedTogether = await ClientServiceRequest.findOne({
      client: clientId,
      'matchedProviders.provider': providerId,
      'matchedProviders.status': 'accepted',
      status: { $in: ['matched', 'in_progress', 'completed'] }
    });
    
    if (!hasWorkedTogether) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only review providers you have worked with'
      });
    }
    
    // Check if client has already reviewed this provider
    const existingReviewIndex = providerService.reviews.findIndex(
      review => review.client && review.client.equals(clientId)
    );
    
    if (existingReviewIndex !== -1) {
      // Update existing review
      providerService.reviews[existingReviewIndex].rating = rating;
      providerService.reviews[existingReviewIndex].comment = comment || '';
      providerService.reviews[existingReviewIndex].date = new Date();
    } else {
      // Add new review
      providerService.reviews.push({
        client: clientId,
        rating,
        comment: comment || '',
        date: new Date()
      });
    }
    
    // Recalculate average rating
    if (providerService.reviews.length > 0) {
      const totalRating = providerService.reviews.reduce((sum, review) => sum + review.rating, 0);
      providerService.averageRating = totalRating / providerService.reviews.length;
    }
    
    await providerService.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Review added successfully',
      data: {
        averageRating: providerService.averageRating,
        reviewCount: providerService.reviews.length
      }
    });
  } catch (error) {
    console.error('Add provider review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while adding the review',
      error: error.message
    });
  }
};

/**
 * Toggle provider active status
 */
const toggleActiveStatus = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { active } = req.body;
    
    // Validate active status
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Active status must be true or false'
      });
    }
    
    // Find provider service
    const providerService = await ProviderService.findOne({ provider: providerId });
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Update active status
    providerService.active = active;
    await providerService.save();
    
    res.status(200).json({
      status: 'success',
      message: `Service profile is now ${active ? 'active' : 'inactive'}`,
      data: {
        active: providerService.active
      }
    });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating active status',
      error: error.message
    });
  }
};

/**
 * Get recommended service requests for a provider
 */
const getRecommendedRequests = async (req, res) => {
  try {
    const providerId = req.user._id;
    
    // Find provider service
    const providerService = await ProviderService.findOne({ provider: providerId });
    
    if (!providerService || !providerService.active) {
      return res.status(404).json({
        status: 'error',
        message: 'You need an active service profile to get recommendations'
      });
    }
    
    // Find open service requests that match the provider's type
    const openRequests = await ClientServiceRequest.find({
      status: 'open',
      requiredProviderTypes: providerService.providerType
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    if (!openRequests || openRequests.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No open service requests found matching your provider type',
        results: 0,
        data: []
      });
    }
    
    // Score each request for this provider
    const scoredRequests = await Promise.all(openRequests.map(async (request) => {
      // Check if provider is already in matchedProviders
      const alreadyMatched = request.matchedProviders.some(
        match => match.provider.toString() === providerId.toString()
      );
      
      if (alreadyMatched) {
        // Skip scoring if already matched
        const match = request.matchedProviders.find(
          m => m.provider.toString() === providerId.toString()
        );
        
        return {
          request,
          matchScore: match.matchScore,
          alreadyMatched: true,
          matchStatus: match.status
        };
      }
      
      // Simulate a match to get score
      const matchParams = {
        ...request.toObject(),
        provider: providerId,
        providerService
      };
      
      // Score the request based on provider's profile
      let matchScore = 0;
      
      // Provider type match (30%)
      if (request.requiredProviderTypes.includes(providerService.providerType)) {
        matchScore += 30;
      }
      
      // Service tags match (40%)
      const tagMatchCount = providerService.serviceTags.filter(tag => 
        request.serviceTags.includes(tag)
      ).length;
      
      if (request.serviceTags.length > 0) {
        matchScore += (tagMatchCount / request.serviceTags.length) * 40;
      }
      
      // Location proximity (30%)
      // Check if the client's location is within the provider's service area
      if (request.location && providerService.serviceArea) {
        const distance = calculateDistance(
          request.location.coordinates[1],  // lat
          request.location.coordinates[0],  // long
          providerService.serviceArea.center.coordinates[1],  // lat
          providerService.serviceArea.center.coordinates[0]   // long
        );
        
        if (distance <= providerService.serviceArea.maxDistance) {
          const distanceScore = (1 - (distance / providerService.serviceArea.maxDistance)) * 30;
          matchScore += distanceScore;
        }
      }
      
      return {
        request,
        matchScore: Math.round(matchScore),
        alreadyMatched: false
      };
    }));
    
    // Sort by match score (highest first)
    const sortedRequests = scoredRequests
      .filter(item => item.matchScore > 50)  // Only return good matches
      .sort((a, b) => b.matchScore - a.matchScore);
    
    // Prepare response data
    const recommendedRequests = sortedRequests.map(item => ({
      _id: item.request._id,
      title: item.request.title,
      description: item.request.description,
      location: item.request.location,
      serviceDate: item.request.serviceDate,
      requiredProviderTypes: item.request.requiredProviderTypes,
      serviceTags: item.request.serviceTags,
      matchScore: item.matchScore,
      alreadyMatched: item.alreadyMatched,
      matchStatus: item.matchStatus || null,
      createdAt: item.request.createdAt
    }));
    
    res.status(200).json({
      status: 'success',
      results: recommendedRequests.length,
      data: recommendedRequests
    });
  } catch (error) {
    console.error('Get recommended requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while finding recommended requests',
      error: error.message
    });
  }
};

/**
 * Calculate distance between two points using the haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

module.exports = {
  createOrUpdateProviderService,
  getProviderServiceById,
  getMyProviderService,
  findProviders,
  updateAvailability,
  addProviderReview,
  toggleActiveStatus,
  getRecommendedRequests
};
