/**
 * Client Preference Service
 * Handles client service preferences and recommendation operations
 */
import config from "../config"; // Centralized API configuration
import ClientGigService from "./clientGigService"; // Import for real recommendations

const ClientPreferenceService = {
  /**
   * Get client preferences
   * @param {string} clientId - The client's ID
   * @returns {Promise<Object>} - Client preferences object
   */
  async getPreferences(clientId) {
    try {
      // Check if preferences are in local storage (offline mode)
      const storedPreferences = localStorage.getItem(`client_preferences_${clientId}`);
      if (storedPreferences) {
        return JSON.parse(storedPreferences);
      }
    
      // Get authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found, using default preferences');
        return this.getDefaultPreferences();
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientPreferences/clientId?clientId=${clientId}`; // Using centralized API config
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // If not found on server (404), return default preferences instead of error
          if (response.status === 404) {
            console.log('No preferences found on server, using defaults');
            return this.getDefaultPreferences();
          }
          throw new Error(`Error fetching preferences: ${response.status}`);
        }
        
        // Safely handle response
        try {
          const data = await response.json();
          // If data is in different format than expected, extract preferences
          const preferences = data.preferences || data;
          
          // Ensure all required fields exist with defaults
          const defaultPrefs = this.getDefaultPreferences();
          const mergedPreferences = {
            ...defaultPrefs,
            ...preferences,
            caregiverPreferences: {
              ...defaultPrefs.caregiverPreferences,
              ...(preferences.caregiverPreferences || {})
            },
            budget: {
              ...defaultPrefs.budget,
              ...(preferences.budget || {})
            }
          };
          
          return mergedPreferences;
        } catch (parseError) {
          console.warn('Failed to parse response data:', parseError);
          return this.getDefaultPreferences();
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out');
          return this.getDefaultPreferences();
        }
        throw fetchError;
      }
      
    } catch (error) {
      console.error("Error in getPreferences:", error);
      // Use default preferences as fallback
      return this.getDefaultPreferences();
    }
  },
  
  /**
   * Save client preferences
   * @param {string} clientId - The client's ID
   * @param {Object} preferences - The preferences to save
   * @returns {Promise<Object>} - Updated preferences object
   */
  async savePreferences(clientId, preferences) {
    try {
      // Store in local storage for offline/testing mode
      localStorage.setItem(`client_preferences_${clientId}`, JSON.stringify(preferences));
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientPreferences`; // Using centralized API config
      
      // Convert preferences object to array of serialized data strings
      // Format required by Azure endpoint: { "clientId": "string", "data": ["string"] }
      const preferencesData = [];
      
      // Add each preference field as a separate serialized item in the data array
      Object.entries(preferences).forEach(([key, value]) => {
        // Handle nested objects like caregiverPreferences and budget
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            preferencesData.push(`${key}:${JSON.stringify(value)}`);
          } else {
            // For nested objects like caregiverPreferences or budget
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (Array.isArray(nestedValue)) {
                preferencesData.push(`${key}.${nestedKey}:${JSON.stringify(nestedValue)}`);
              } else {
                preferencesData.push(`${key}.${nestedKey}:${nestedValue}`);
              }
            });
          }
        } else {
          // For simple key-value pairs
          preferencesData.push(`${key}:${value}`);
        }
      });
      
      // Prepare the payload for Azure API endpoint with the required format
      const payload = {
        clientId: clientId,
        data: preferencesData
      };
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Get more detailed error information
          let errorMessage = `Error saving preferences: ${response.status}`;
          
          // Only try to parse JSON if the content type is JSON
          if (response.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              console.warn('Failed to parse error response:', jsonError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Safely handle response
        try {
          const data = await response.json();
          return data;
        } catch (parseError) {
          console.warn('Failed to parse success response:', parseError);
          // Return success status even if we couldn't parse the response
          return { success: true, message: 'Preferences saved successfully' };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out');
          // We've already saved to localStorage, so we can inform the user it's saved offline
          throw new Error('Server request timed out, preferences saved locally');
        }
        throw fetchError;
      }
      
    } catch (error) {
      console.error("Error in savePreferences:", error);
      // Re-throw the error for the component to handle
      throw error;
    }
  },
  
  /**
   * Get service recommendations based on preferences
   * @param {string} clientId - The client's ID
   * @param {Object} preferences - Client preferences
   * @returns {Promise<Array>} - Array of recommended services
   */
  async getRecommendations(clientId, preferences) {
    try {
      // Get real recommendations from gigs
      const recommendations = await this.getRealRecommendations(preferences);
      
      // Try to load cached recommendations from local storage if they exist
      const storedRecommendationsJson = localStorage.getItem(`client_recommendations_${clientId}`);
      let storedRecommendations = null;
      
      if (storedRecommendationsJson) {
        try {
          const parsedData = JSON.parse(storedRecommendationsJson);
          if (parsedData && parsedData.recommendations && parsedData.recommendations.length) {
            storedRecommendations = parsedData.recommendations;
            console.log('Retrieved stored recommendations');
          }
        } catch (parseError) {
          console.warn('Failed to parse stored recommendations:', parseError);
        }
      }
      
      // Save recommendations to Azure
      const saveResult = await this.saveRecommendationsToAzure(clientId, recommendations);
      
      if (!saveResult || !saveResult.success) {
        console.warn("Couldn't save recommendations to Azure, using local data");
      }
      
      // Use local storage recommendations if available and API call failed
      const finalRecommendations = recommendations.length > 0 ? recommendations : 
        (storedRecommendations || []);
      
      return finalRecommendations;
      
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      
      // Try to use cached recommendations as a fallback
      try {
        const storedRecommendationsJson = localStorage.getItem(`client_recommendations_${clientId}`);
        if (storedRecommendationsJson) {
          const parsedData = JSON.parse(storedRecommendationsJson);
          if (parsedData && parsedData.recommendations && parsedData.recommendations.length) {
            return parsedData.recommendations;
          }
        }
      } catch (fallbackError) {
        console.error("Also failed to get stored recommendations:", fallbackError);
      }
      
      return [];
    }
  },
  
  /**
   * Save recommendations to Azure
   * @param {string} clientId - The client's ID
   * @param {Array} recommendations - Array of recommended services
   * @returns {Promise<Object>} - Response from Azure
   */
  async saveRecommendationsToAzure(clientId, recommendations) {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('Authentication token not found, skipping recommendation saving');
        return { success: false, message: 'No authentication token' };
      }
      
      // Use the Azure API endpoint
      const API_URL = `${config.BASE_URL}/ClientRecommendations/${clientId}`; // Using centralized API config
      
      // Prepare recommendations in the required format
      const recommendationData = recommendations.map(rec => ({
        providerId: rec.id,
        matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score between 70-100
        serviceType: rec.serviceType,
        location: rec.location,
        price: rec.price,
        rating: rec.rating,
        reviewCount: rec.reviewCount
      }));
      
      const payload = {
        clientId: clientId,
        recommendations: recommendationData,
        generatedAt: new Date().toISOString()
      };
      
      // Store recommendations locally as a fallback
      localStorage.setItem(`client_recommendations_${clientId}`, JSON.stringify({
        recommendations: recommendationData,
        timestamp: payload.generatedAt
      }));
      
      // Try sending to Azure API, with timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`API returned ${response.status} when saving recommendations`);
          
          // Don't try to parse the response if it's not JSON
          if (response.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await response.json();
              console.log('API error details:', errorData);
            } catch (jsonError) {
              console.warn('No valid JSON in error response');
            }
          }
          
          // Return gracefully with info about the error
          return { 
            success: false, 
            status: response.status,
            message: `API returned ${response.status}`,
            savedLocally: true
          };
        }
        
        // Safely parse response, with fallback
        try {
          const data = await response.json();
          return { ...data, success: true };
        } catch (parseError) {
          console.warn('Failed to parse successful response:', parseError);
          return { success: true, message: 'Saved, but response parsing failed' };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out');
          return { success: false, message: 'Request timed out', savedLocally: true };
        }
        throw fetchError; // Re-throw other fetch errors
      }
    } catch (error) {
      console.warn("Error in saveRecommendationsToAzure:", error);
      return { 
        success: false, 
        message: error.message || 'Unknown error saving recommendations',
        savedLocally: true
      };
    }
  },
  
  /**
   * Get default preferences
   * @returns {Object} - Default preferences object
   */
  getDefaultPreferences() {
    return {
      serviceType: '',
      location: '',
      schedule: '',
      needs: '',
      caregiverPreferences: {
        gender: '',
        ageRange: '',
        experience: '',
        languages: []
      },
      serviceFrequency: 'as-needed',
      budget: {
        min: '',
        max: ''
      },
      specialRequirements: ''
    };
  },
  
  /**
   * Get real recommendations based on preferences using ClientGigService
   * @param {Object} preferences - Client preferences
   * @returns {Promise<Array>} - Array of recommended services from actual gigs
   */
  async getRealRecommendations(preferences) {
    try {
      // Get all enriched gigs from ClientGigService
      const allGigs = await ClientGigService.getAllGigs();
      
      if (!allGigs || allGigs.length === 0) {
        console.log('No gigs available for recommendations');
        return [];
      }
      
      // Apply filtering based on preferences
      let filteredGigs = [...allGigs];
      
      // Filter by service type (category)
      if (preferences.serviceType && preferences.serviceType.trim() !== '') {
        filteredGigs = filteredGigs.filter(gig => {
          const gigCategory = (gig.category || '').toLowerCase();
          const prefServiceType = preferences.serviceType.toLowerCase();
          
          // Handle subCategory - it can be string or array
          let gigSubCategory = '';
          if (Array.isArray(gig.subCategory)) {
            gigSubCategory = gig.subCategory.join(' ').toLowerCase();
          } else if (typeof gig.subCategory === 'string') {
            gigSubCategory = gig.subCategory.toLowerCase();
          }
          
          return gigCategory.includes(prefServiceType) || 
                 gigSubCategory.includes(prefServiceType) ||
                 prefServiceType.includes(gigCategory);
        });
      }
      
      // Filter by location
      if (preferences.location && preferences.location.trim() !== '') {
        filteredGigs = filteredGigs.filter(gig => {
          const gigLocation = (gig.caregiverLocation || '').toLowerCase();
          const prefLocation = preferences.location.toLowerCase();
          const serviceArea = (gig.serviceArea || '').toLowerCase();
          
          return gigLocation.includes(prefLocation) || 
                 prefLocation.includes(gigLocation) ||
                 serviceArea.includes(prefLocation);
        });
      }
      
      // Filter by budget range
      if (preferences.budget) {
        if (preferences.budget.min && preferences.budget.min !== '') {
          const minBudget = parseFloat(preferences.budget.min);
          filteredGigs = filteredGigs.filter(gig => 
            (gig.price || 0) >= minBudget
          );
        }
        
        if (preferences.budget.max && preferences.budget.max !== '') {
          const maxBudget = parseFloat(preferences.budget.max);
          filteredGigs = filteredGigs.filter(gig => 
            (gig.price || 0) <= maxBudget
          );
        }
      }
      
      // Filter by caregiver preferences
      if (preferences.caregiverPreferences) {
        const cgPrefs = preferences.caregiverPreferences;
        
        // Filter by experience level
        if (cgPrefs.experience && cgPrefs.experience.trim() !== '') {
          const experienceMap = {
            'beginner': 0,
            'intermediate': 2,
            'experienced': 5,
            'expert': 10
          };
          
          const minExp = experienceMap[cgPrefs.experience.toLowerCase()] || 0;
          filteredGigs = filteredGigs.filter(gig => 
            (gig.caregiverExperience || 0) >= minExp
          );
        }
        
        // Filter by languages
        if (cgPrefs.languages && Array.isArray(cgPrefs.languages) && cgPrefs.languages.length > 0) {
          filteredGigs = filteredGigs.filter(gig => {
            if (!gig.caregiverLanguages || !Array.isArray(gig.caregiverLanguages) || gig.caregiverLanguages.length === 0) {
              return false;
            }
            
            // Check if caregiver speaks at least one of the preferred languages
            return cgPrefs.languages.some(prefLang => {
              if (!prefLang || typeof prefLang !== 'string') return false;
              return gig.caregiverLanguages.some(cgLang => {
                if (!cgLang || typeof cgLang !== 'string') return false;
                return cgLang.toLowerCase().includes(prefLang.toLowerCase()) ||
                       prefLang.toLowerCase().includes(cgLang.toLowerCase());
              });
            });
          });
        }
        
        // Filter by gender preference (if available in caregiver data)
        if (cgPrefs.gender && cgPrefs.gender.trim() !== '' && cgPrefs.gender.toLowerCase() !== 'no preference') {
          filteredGigs = filteredGigs.filter(gig => {
            // Check if gender field exists in caregiver data
            if (gig.caregiverGender) {
              return gig.caregiverGender.toLowerCase() === cgPrefs.gender.toLowerCase();
            }
            // If no gender data, include the gig (don't filter out)
            return true;
          });
        }
      }
      
      // Filter by availability (if schedule preference is set)
      if (preferences.schedule && preferences.schedule.trim() !== '') {
        filteredGigs = filteredGigs.filter(gig => 
          gig.caregiverIsAvailable !== false
        );
      }
      
      // Calculate relevance score for each gig
      const gigsWithScore = filteredGigs.map(gig => ({
        ...gig,
        relevanceScore: (
          (gig.caregiverRating || 0) * 20 + // Rating weight
          (gig.caregiverReviewCount || 0) * 0.5 + // Review count weight
          (gig.caregiverIsVerified ? 15 : 0) + // Verified boost
          (gig.caregiverExperience || 0) * 2 // Experience weight
        )
      }));
      
      // Sort by relevance score (highest first)
      gigsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Transform to expected recommendation format and limit to top 10
      const recommendations = gigsWithScore.slice(0, 10).map(gig => ({
        id: gig.id,
        title: gig.title || 'Untitled Service',
        provider: gig.caregiverName || 'Unknown Provider',
        rating: gig.caregiverRating || 0,
        reviewCount: gig.caregiverReviewCount || 0,
        price: gig.price || 0,
        priceUnit: gig.priceUnit || 'hour',
        serviceType: gig.category || 'General Care',
        location: gig.caregiverLocation || 'Location not specified',
        image: gig.gigImage || gig.caregiverProfileImage || 'https://via.placeholder.com/150',
        // Additional enriched data for future use
        caregiverId: gig.caregiverId,
        caregiverBio: gig.caregiverBio,
        caregiverExperience: gig.caregiverExperience,
        caregiverIsVerified: gig.caregiverIsVerified,
        caregiverSpecializations: gig.caregiverSpecializations,
        description: gig.description
      }));
      
      console.log(`Generated ${recommendations.length} real recommendations from ${allGigs.length} available gigs`);
      return recommendations;
      
    } catch (error) {
      console.error('Error generating real recommendations:', error);
      // Return empty array if real recommendations fail
      return [];
    }
  },
  
  /**
   * Get mock recommendations based on preferences (fallback)
   * @param {Object} preferences - Client preferences
   * @returns {Array} - Array of mock recommended services
   */
  getMockRecommendations(preferences) {
    const mockServices = [
      {
        id: "svc-001",
        title: "Professional Home Care",
        provider: "Maria Johnson",
        rating: 4.9,
        reviewCount: 124,
        price: 25,
        priceUnit: "hour",
        serviceType: "Home Care",
        location: "Lagos",
        image: "https://example.com/images/service1.jpg"
      },
      {
        id: "svc-002",
        title: "Expert Elder Care",
        provider: "John Smith",
        rating: 4.8,
        reviewCount: 98,
        price: 30,
        priceUnit: "hour",
        serviceType: "Elder Care",
        location: "Abuja",
        image: "https://example.com/images/service2.jpg"
      },
      {
        id: "svc-003",
        title: "Child Care Specialist",
        provider: "Lisa Anderson",
        rating: 4.7,
        reviewCount: 86,
        price: 22,
        priceUnit: "hour",
        serviceType: "Child Care",
        location: "Port Harcourt",
        image: "https://example.com/images/service3.jpg"
      },
      {
        id: "svc-004",
        title: "Post-Surgery Recovery Care",
        provider: "Robert Williams",
        rating: 4.9,
        reviewCount: 112,
        price: 35,
        priceUnit: "hour",
        serviceType: "Post-Surgery Care",
        location: "Lagos",
        image: "https://example.com/images/service4.jpg"
      },
      {
        id: "svc-005",
        title: "Special Needs Care",
        provider: "James Wilson",
        rating: 4.8,
        reviewCount: 78,
        price: 32,
        priceUnit: "hour",
        serviceType: "Special Needs Care",
        location: "Ibadan",
        image: "https://example.com/images/service5.jpg"
      }
    ];
    
    // Filter based on preferences
    let filtered = [...mockServices];
    
    if (preferences.serviceType) {
      filtered = filtered.filter(service => 
        service.serviceType === preferences.serviceType);
    }
    
    if (preferences.location) {
      filtered = filtered.filter(service => 
        service.location === preferences.location);
    }
    
    // If no matches after filtering, return some default recommendations
    if (filtered.length === 0) {
      return mockServices.slice(0, 3);
    }
    
    return filtered;
  }
};

export default ClientPreferenceService;
