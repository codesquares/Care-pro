const axios = require('axios');
require('dotenv').config();

/**
 * Analyzes a client's service request using AI
 * 
 * @param {Object} serviceRequest - The client's service request object
 * @returns {Promise<Object>} AI analysis of the service request
 */
const analyzeClientServiceRequest = async (serviceRequest) => {
  try {
    const { title, description } = serviceRequest;
    
    const messages = [
      {
        role: 'system',
        content: `You are an AI healthcare service assistant that analyzes client service requests and breaks them down into 
        structured data for matching with appropriate healthcare providers. Consider the client's needs, requested services, 
        and any specific requirements when analyzing the request.
        
        Return a detailed structured analysis in JSON format with the following fields:
        1. requiredProviderTypes: Array of provider types (caregiver, nurse, doctor, dietician) needed based on service description
        2. serviceTags: Array of relevant service tags/keywords for matching (at least 5, maximum 10)
        3. serviceBreakdown: Array of specific tasks needed, each with 'task', 'description', and 'estimatedTime' (in minutes) fields
        4. confidenceScore: Number from 0-100 indicating your confidence in this analysis
        5. notesForClient: Any clarifying questions or additional information needed from the client
        6. notesForProvider: Important notes or context that would help a provider understand this request`
      },
      {
        role: 'user',
        content: `Please analyze the following client service request:
        
        Title: ${title}
        
        Description: ${description}
        
        Format your response as a valid JSON object only, with no additional explanation or text.`
      }
    ];

    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4', // Using GPT-4 for better analysis
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices || !result.data.choices[0] || !result.data.choices[0].message) {
      throw new Error('Invalid OpenAI API response');
    }

    const content = result.data.choices[0].message.content;
    
    // Parse JSON response
    let analysisData;
    try {
      analysisData = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse AI analysis result');
    }

    return {
      requiredProviderTypes: analysisData.requiredProviderTypes || [],
      serviceTags: analysisData.serviceTags || [],
      serviceBreakdown: analysisData.serviceBreakdown || [],
      confidenceScore: analysisData.confidenceScore || 0,
      notesForClient: analysisData.notesForClient || "",
      notesForProvider: analysisData.notesForProvider || "",
      rawAnalysis: content
    };
  } catch (error) {
    console.error('Error analyzing service request:', error.response?.data || error.message);
    throw new Error(`Failed to analyze service request: ${error.message}`);
  }
};

/**
 * Finds matching providers for a client service request
 * 
 * @param {Object} serviceRequest - The client's service request with AI analysis
 * @param {Number} limit - Maximum number of matches to return
 * @returns {Promise<Array>} Array of matching providers with scores
 */
const findMatchingProviders = async (serviceRequest, limit = 10) => {
  try {
    const ProviderService = require('../models/providerServiceModel');
    const { 
      requiredProviderTypes, 
      serviceTags, 
      location, 
      maxDistance 
    } = serviceRequest;
    
    // Basic geographic query to find providers within the client's preferred radius
    const geoQuery = {
      'serviceArea.center': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    };
    
    // Query for provider type match
    const typeQuery = {
      providerType: { $in: requiredProviderTypes },
      active: true
    };
    
    // Combine queries
    const query = { ...geoQuery, ...typeQuery };
    
    // Find potential matches
    const providers = await ProviderService.find(query)
      .populate('provider', 'firstName lastName email phone')
      .limit(limit * 2) // Get more than needed for scoring
      .lean();
    
    if (!providers || providers.length === 0) {
      return [];
    }
    
    // Score the providers
    const scoredProviders = providers.map(provider => {
      let score = 0;
      
      // Base score for provider type match (30%)
      if (requiredProviderTypes.includes(provider.providerType)) {
        score += 30;
      }
      
      // Score for service tag matches (40%)
      const tagMatchCount = provider.serviceTags.filter(tag => 
        serviceTags.includes(tag)
      ).length;
      
      if (serviceTags.length > 0) {
        score += (tagMatchCount / serviceTags.length) * 40;
      }
      
      // Score for ratings (20%)
      score += provider.averageRating * 4; // 0-5 rating converted to 0-20 score
      
      // Score for distance (10%)
      // Closer is better, so calculate inverse proportion to max distance
      const distance = calculateDistance(
        location.coordinates[1], 
        location.coordinates[0],
        provider.serviceArea.center.coordinates[1],
        provider.serviceArea.center.coordinates[0]
      );
      
      if (distance <= maxDistance) {
        score += (1 - (distance / maxDistance)) * 10;
      }
      
      return {
        provider: provider.provider,
        matchScore: Math.round(score),
        providerDetails: provider
      };
    });
    
    // Sort by score (highest first) and take only the requested limit
    return scoredProviders
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error finding matching providers:', error);
    throw new Error(`Failed to find matching providers: ${error.message}`);
  }
};

/**
 * Calculate the distance between two points using the haversine formula
 * 
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in kilometers
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

/**
 * Generates priority recommendations for a client based on provider matches
 * 
 * @param {Array} matchedProviders - Array of matched providers with scores
 * @returns {Array} Providers with priority values assigned
 */
const generatePriorityRecommendations = (matchedProviders) => {
  // Sort providers by match score (highest first)
  const sortedProviders = [...matchedProviders].sort((a, b) => b.matchScore - a.matchScore);
  
  // Calculate priority based on position in sorted list
  return sortedProviders.map((provider, index) => {
    return {
      ...provider,
      priority: index + 1 // Priority 1 is the highest
    };
  });
};

module.exports = {
  analyzeClientServiceRequest,
  findMatchingProviders,
  generatePriorityRecommendations
};
