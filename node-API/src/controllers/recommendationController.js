// src/controllers/recommendationController.js
const axios = require('axios');
const { analyzeClientNeedsAndPreferences } = require('../services/clientAiService');
const { configDotenv } = require('dotenv');
configDotenv();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

/**
 * Get recommended gigs for a client based on their needs and preferences
 */
const getRecommendationsForClient = async (req, res) => {
  try {
    // Get authenticated user
    const user = req.user;
    
    if (!user || !user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authorized to get recommendations'
      });
    }
    
    // Check if user is a client
    if (user.role !== 'client') {
      return res.status(403).json({
        status: 'error',
        message: 'Only clients can get gig recommendations'
      });
    }
    
    // Get client preferences from request
    const { serviceType, location, schedule, needs } = req.body;
    
    if (!serviceType) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type is required for recommendations'
      });
    }
    
    // Analyze client needs using AI
    const clientAnalysis = await analyzeClientNeedsAndPreferences({
      serviceType,
      location,
      schedule,
      needs
    });
    
    // Fetch all available gigs from external API
    const gigsResponse = await axios.get(`${External_API}/Gigs`);
    const allGigs = gigsResponse.data;
    
    // Filter and rank gigs based on client analysis
    const rankedGigs = rankGigsByClientNeeds(allGigs, clientAnalysis);
    
    // Return top recommendations
    res.status(200).json({
      status: 'success',
      userId: user.id,
      recommendations: rankedGigs.slice(0, 10), // Return top 10 matches
      matchAnalysis: clientAnalysis
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting recommendations'
    });
  }
};

/**
 * Rank gigs based on how well they match client needs
 */
const rankGigsByClientNeeds = (gigs, clientAnalysis) => {
  // If no gigs or empty array, return empty array
  if (!gigs || !Array.isArray(gigs) || gigs.length === 0) {
    return [];
  }
  
  // Map gigs with match scores
  const scoredGigs = gigs.map(gig => {
    // Calculate match score based on multiple factors
    let score = 0;
    
    // Match service type (most important)
    if (gig.serviceType === clientAnalysis.serviceType) {
      score += 40;
    }
    
    // Match location if provided
    if (clientAnalysis.location && gig.location === clientAnalysis.location) {
      score += 20;
    }
    
    // Match schedule if provided
    if (clientAnalysis.schedule && gig.availability) {
      // Simple schedule matching - can be made more sophisticated
      if (gig.availability.includes(clientAnalysis.schedule)) {
        score += 15;
      }
    }
    
    // Match specific needs if provided
    if (clientAnalysis.keywords && Array.isArray(clientAnalysis.keywords)) {
      // Check if any keywords match the gig description or tags
      const gigText = `${gig.title} ${gig.description} ${gig.tags ? gig.tags.join(' ') : ''}`.toLowerCase();
      const keywordMatches = clientAnalysis.keywords.filter(keyword => 
        gigText.includes(keyword.toLowerCase())
      );
      
      // Add points for keyword matches
      score += keywordMatches.length * 5;
    }
    
    // Return gig with score
    return {
      ...gig,
      matchScore: score
    };
  });
  
  // Sort by match score (highest first)
  return scoredGigs.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Get recommended clients for a caregiver based on their gigs and skills
 */
const getClientMatchesForCaregiver = async (req, res) => {
  try {
    // Get authenticated user
    const user = req.user;
    
    if (!user || !user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authorized to get client matches'
      });
    }
    
    // Check if user is a caregiver
    if (user.role !== 'caregiver') {
      return res.status(403).json({
        status: 'error',
        message: 'Only caregivers can get client matches'
      });
    }
    
    // Get caregiver's gigs
    const gigsResponse = await axios.get(`${External_API}/Gigs/caregiver/${user.id}`);
    const caregiverGigs = gigsResponse.data;
    
    // Get all client service requests
    const clientRequestsResponse = await axios.get(`${External_API}/Clients/AllClientUsers`);
    const allClientRequests = clientRequestsResponse.data;
    
    // Match caregiver gigs with client requests
    const matches = matchCaregiverToClients(caregiverGigs, allClientRequests);
    
    // Return matches
    res.status(200).json({
      status: 'success',
      userId: user.id,
      matches: matches.slice(0, 10) // Return top 10 matches
    });
  } catch (error) {
    console.error('Get client matches error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting client matches'
    });
  }
};

/**
 * Match a caregiver's gigs with client requests
 */
const matchCaregiverToClients = (caregiverGigs, clientRequests) => {
  // If no gigs or client requests, return empty array
  if (!caregiverGigs || !Array.isArray(caregiverGigs) || caregiverGigs.length === 0 ||
      !clientRequests || !Array.isArray(clientRequests) || clientRequests.length === 0) {
    return [];
  }
  
  // Extract caregiver's service types and skills
  const caregiverServices = caregiverGigs.map(gig => gig.serviceType);
  const caregiverSkills = caregiverGigs.reduce((skills, gig) => {
    if (gig.tags && Array.isArray(gig.tags)) {
      return [...skills, ...gig.tags];
    }
    return skills;
  }, []);
  
  // Map client requests with match scores
  const scoredMatches = clientRequests.map(client => {
    // Calculate match score
    let score = 0;
    
    // Check if client has service requests that match caregiver services
    if (client.serviceRequests && Array.isArray(client.serviceRequests)) {
      client.serviceRequests.forEach(request => {
        // Match service type
        if (caregiverServices.includes(request.serviceType)) {
          score += 30;
        }
        
        // Match skills to client needs
        if (request.needs && Array.isArray(request.needs)) {
          const matchingSkills = request.needs.filter(need => 
            caregiverSkills.includes(need)
          );
          score += matchingSkills.length * 10;
        }
      });
    }
    
    // Return client with score
    return {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      matchScore: score,
      serviceRequests: client.serviceRequests || []
    };
  });
  
  // Sort by match score (highest first)
  return scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = {
  getRecommendationsForClient,
  getClientMatchesForCaregiver
};
