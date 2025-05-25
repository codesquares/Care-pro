// src/controllers/providerServiceController.js
const axios = require('axios');
const { findMatchingProviders } = require('../services/clientAiService');
const { configDotenv } = require('dotenv');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

/**
 * Create or update provider service profile
 */
const createOrUpdateProviderService = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    // Check if the user is a caregiver, nurse, doctor, or dietician
    if (!['caregiver', 'nurse', 'doctor', 'dietician'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only healthcare providers can create service profiles'
      });
    }
    
    // Check if provider is verified
    if (req.user.verificationStatus !== 'verified') {
      return res.status(403).json({
        status: 'error',
        message: 'Your profile needs to be verified before you can create service listings'
      });
    }
    
    // Create service profile data from request
    const serviceData = {
      provider: providerId,
      ...req.body
    };
    
    // Check if provider already has a service profile using external API
    try {
      const existingResponse = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
        }
      });
      
      const existingProviderService = existingResponse.data?.data?.[0];
      
      if (existingProviderService) {
        // Update existing profile
        const updateResponse = await axios.patch(`${External_API}/provider-services/${existingProviderService.id}`, 
          serviceData,
          {
            headers: {
              'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return res.status(200).json({
          status: 'success',
          message: 'Provider service profile updated successfully',
          data: updateResponse.data.data
        });
      }
    } catch (error) {
      console.log('Error checking for existing provider service:', error.message);
      // Continue with creating a new service profile if check fails
    }
    
    // Create new profile
    const createResponse = await axios.post(`${External_API}/provider-services`, serviceData, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Provider service profile created successfully',
      data: createResponse.data.data
    });
  } catch (error) {
    console.error('Provider service create/update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating or updating provider service',
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
    
    // Find provider service via external API
    try {
      const response = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
        }
      });
      
      const providerService = response.data?.data?.[0];
      
      if (!providerService) {
        return res.status(404).json({
          status: 'error',
          message: 'Provider service profile not found'
        });
      }
      
      // Check if the provider is active
      if (!providerService.active && 
          req.user.id !== providerService.provider && 
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
    const providerId = req.user.id;
    
    // Find provider service via external API
    try {
      const response = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
        }
      });
      
      const providerService = response.data?.data?.[0];
      
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
    
    // Build query params for external API
    let queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (providerType) {
      queryParams.append('providerType', providerType);
    }
    
    if (serviceTypes && serviceTypes.length > 0) {
      serviceTypes.forEach(type => queryParams.append('serviceTypes', type));
    }
    
    if (serviceTags && serviceTags.length > 0) {
      serviceTags.forEach(tag => queryParams.append('serviceTags', tag));
    }
    
    // Handle location filtering
    if (location && location.coordinates && maxDistance) {
      queryParams.append('latitude', location.coordinates[1]);
      queryParams.append('longitude', location.coordinates[0]);
      queryParams.append('maxDistance', maxDistance);
    }
    
    queryParams.append('active', 'true');
    queryParams.append('limit', '20');
    queryParams.append('sort', '-averageRating');
    
    // Find providers matching the criteria via external API
    const response = await axios.get(`${External_API}/provider-services?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
      }
    });
    
    const providers = response.data?.data || [];
    
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
    const providerId = req.user.id;
    const { availability } = req.body;
    
    // Validate availability data
    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid availability data'
      });
    }
    
    // Get provider service via external API
    try {
      const getResponse = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
        }
      });
      
      const providerService = getResponse.data?.data?.[0];
      
      if (!providerService) {
        return res.status(404).json({
          status: 'error',
          message: 'Provider service profile not found'
        });
      }
      
      // Update availability via external API
      const updateResponse = await axios.patch(
        `${External_API}/provider-services/${providerService.id}`, 
        { 
          availability: {
            ...providerService.availability,
            ...availability
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Availability updated successfully',
        data: updateResponse.data.data.availability
      });
    } catch (error) {
      console.error('Update availability error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while updating availability',
        error: error.message
      });
    }
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
    const clientId = req.user.id;
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    // Get auth token for external API requests
    const token = req.headers.authorization.split(' ')[1];
    
    // Find the provider service via external API
    const providerResponse = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const providerService = providerResponse.data?.data?.[0];
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Check if client has worked with this provider before via external API
    const workHistoryResponse = await axios.get(
      `${External_API}/client-service-requests?clientId=${clientId}&providerId=${providerId}&status=completed,in_progress,matched`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const hasWorkedTogether = workHistoryResponse.data?.data?.length > 0;
    
    if (!hasWorkedTogether) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only review providers you have worked with'
      });
    }
    
    // Get existing reviews to check if client has already reviewed this provider
    const existingReviews = providerService.reviews || [];
    const existingReviewIndex = existingReviews.findIndex(
      review => review.client === clientId
    );
    
    // Prepare review data for the API call
    const reviewData = {
      rating,
      comment: comment || '',
      date: new Date().toISOString()
    };
    
    let reviews;
    
    if (existingReviewIndex !== -1) {
      // Update existing review
      reviews = [...existingReviews];
      reviews[existingReviewIndex] = {
        ...reviews[existingReviewIndex],
        ...reviewData
      };
    } else {
      // Add new review
      reviews = [
        ...existingReviews,
        {
          client: clientId,
          ...reviewData
        }
      ];
    }
    
    // Calculate new average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    // Update the provider service with the new reviews and average rating via API
    const updateResponse = await axios.patch(
      `${External_API}/provider-services/${providerService.id}`,
      { 
        reviews,
        averageRating 
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const updatedProviderService = updateResponse.data?.data;
    
    res.status(200).json({
      status: 'success',
      message: 'Review added successfully',
      data: {
        averageRating: updatedProviderService.averageRating,
        reviewCount: updatedProviderService.reviews.length
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
    const providerId = req.user.id;
    const { active } = req.body;
    
    // Validate active status
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Active status must be true or false'
      });
    }
    
    // Get auth token
    const token = req.headers.authorization.split(' ')[1];
    
    // Find provider service via external API
    const getResponse = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const providerService = getResponse.data?.data?.[0];
    
    if (!providerService) {
      return res.status(404).json({
        status: 'error',
        message: 'Provider service profile not found'
      });
    }
    
    // Update active status via external API
    const updateResponse = await axios.patch(
      `${External_API}/provider-services/${providerService.id}`,
      { active },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: `Service profile is now ${active ? 'active' : 'inactive'}`,
      data: {
        active: updateResponse.data.data.active
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
    const providerId = req.user.id;
    const token = req.headers.authorization.split(' ')[1];
    
    // Get provider service via external API
    const providerResponse = await axios.get(`${External_API}/provider-services?providerId=${providerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const providerService = providerResponse.data?.data?.[0];
    
    if (!providerService || !providerService.active) {
      return res.status(404).json({
        status: 'error',
        message: 'You need an active service profile to get recommendations'
      });
    }
    
    // Get open service requests that match the provider's type via external API
    const requestsResponse = await axios.get(
      `${External_API}/client-service-requests?status=open&providerType=${providerService.providerType}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const openRequests = requestsResponse.data?.data || [];
    
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
      const alreadyMatched = request.matchedProviders?.some(
        match => match.provider === providerId
      );
      
      if (alreadyMatched) {
        // Skip scoring if already matched
        const match = request.matchedProviders.find(
          m => m.provider === providerId
        );
        
        return {
          request,
          matchScore: match.matchScore,
          alreadyMatched: true,
          matchStatus: match.status
        };
      }
      
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
      id: item.request.id,
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
