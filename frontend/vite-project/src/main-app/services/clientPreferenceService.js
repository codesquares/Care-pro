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
      
      // Save recommendations to Azure (only if we have recommendations)
      if (recommendations.length > 0) {
        const saveResult = await this.saveRecommendationsToAzure(clientId, recommendations);
        
        if (!saveResult || !saveResult.success) {
          console.warn("Couldn't save recommendations to Azure, using local data");
        }
      } else {
        console.log('⏭️ Skipping save - no recommendations to save');
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
      
      // Prepare recommendations in the required format per backend API spec
      const recommendationData = recommendations.map(rec => {
        const matchScore = rec.relevanceScore || Math.floor(Math.random() * 30) + 70;
        
        return {
          providerId: String(rec.id || rec.providerId),
          caregiverId: rec.caregiverId ? String(rec.caregiverId) : null, // Optional field
          matchScore: Math.min(100, Math.max(0, Math.round(matchScore))), // Ensure 0-100 integer
          serviceType: String(rec.serviceType || 'General Care'),
          location: String(rec.location || 'Not specified'),
          price: Math.max(0, parseFloat(rec.price) || 0), // Ensure positive number
          priceUnit: String(rec.priceUnit || 'hour'),
          rating: Math.min(5, Math.max(0, parseFloat(rec.rating) || 0)), // Ensure 0-5 range
          reviewCount: Math.max(0, parseInt(rec.reviewCount) || 0) // Ensure non-negative integer
        };
      });
      
      const payload = {
        clientId: clientId,
        recommendations: recommendationData,
        generatedAt: new Date().toISOString()
      };
      
      // Check if recommendations already exist (to decide POST vs PUT)
      let existingRecommendationId = localStorage.getItem(`recommendation_id_${clientId}`);
      let shouldUpdate = false;
      
      // Try to fetch existing recommendations from backend
      try {
        const checkResponse = await fetch(
          `${config.BASE_URL}/ClientRecommendations/client/${clientId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (checkResponse.ok) {
          const existingData = await checkResponse.json();
          if (existingData.recommendationId) {
            existingRecommendationId = existingData.recommendationId;
            shouldUpdate = true;
          }
        }
      } catch (checkError) {
        console.log('Could not check existing recommendations, will create new');
      }
      
      // Determine endpoint and method
      const method = shouldUpdate ? 'PUT' : 'POST';
      const endpoint = shouldUpdate 
        ? `${config.BASE_URL}/ClientRecommendations/client/${clientId}`
        : `${config.BASE_URL}/ClientRecommendations/${clientId}`;
      
      // Store recommendations locally as a fallback
      localStorage.setItem(`client_recommendations_${clientId}`, JSON.stringify({
        recommendations: recommendationData,
        recommendationId: existingRecommendationId,
        timestamp: payload.generatedAt
      }));
      
      // Try sending to Azure API, with timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log(`📤 ${method} recommendations to ${endpoint}`);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      try {
        const response = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`❌ API returned ${response.status} when saving recommendations`);
          
          // Try to parse error response for debugging
          if (response.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await response.json();
              console.error('API error details:', errorData);
              
              // Log validation errors if present
              if (errorData.details && Array.isArray(errorData.details)) {
                console.error('Validation errors:', errorData.details);
              }
              
              return {
                success: false,
                status: response.status,
                message: errorData.message || `API returned ${response.status}`,
                details: errorData.details || [],
                savedLocally: true
              };
            } catch (jsonError) {
              console.warn('No valid JSON in error response');
            }
          } else {
            // Try to get text response for debugging
            try {
              const textError = await response.text();
              console.error('API error text:', textError);
            } catch (e) {
              console.error('Could not read error response');
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
          
          // Store recommendationId for future updates
          if (data.recommendationId) {
            localStorage.setItem(`recommendation_id_${clientId}`, data.recommendationId);
          }
          
          console.log(`Recommendations ${method === 'PUT' ? 'updated' : 'created'} successfully:`, data);
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
      
      console.log(`🎯 Starting with ${allGigs.length} published gigs`);
      
      // Apply filtering based on preferences
      let filteredGigs = [...allGigs];
      
      // Filter by service type (category)
      if (preferences.serviceType && preferences.serviceType.trim() !== '') {
        const beforeCount = filteredGigs.length;
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
        console.log(`🔍 After service type filter (${preferences.serviceType}): ${filteredGigs.length}/${beforeCount} gigs remain`);
      }
      
      // Filter by location
      if (preferences.location && preferences.location.trim() !== '') {
        const beforeCount = filteredGigs.length;
        filteredGigs = filteredGigs.filter(gig => {
          const gigLocation = (gig.caregiverLocation || '').toLowerCase();
          const prefLocation = preferences.location.toLowerCase();
          const serviceArea = (gig.serviceArea || '').toLowerCase();
          
          return gigLocation.includes(prefLocation) || 
                 prefLocation.includes(gigLocation) ||
                 serviceArea.includes(prefLocation);
        });
        console.log(`📍 After location filter (${preferences.location}): ${filteredGigs.length}/${beforeCount} gigs remain`);
      }
      
      // Filter by budget range
      if (preferences.budget) {
        const beforeCount = filteredGigs.length;
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
        if (beforeCount !== filteredGigs.length) {
          console.log(`💰 After budget filter (${preferences.budget.min}-${preferences.budget.max}): ${filteredGigs.length}/${beforeCount} gigs remain`);
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
      const gigsWithScore = filteredGigs.map(gig => {
        const rawScore = (
          (gig.caregiverRating || 0) * 20 + // Rating weight
          (gig.caregiverReviewCount || 0) * 0.5 + // Review count weight
          (gig.caregiverIsVerified ? 15 : 0) + // Verified boost
          (gig.caregiverExperience || 0) * 2 // Experience weight
        );
        
        return {
          ...gig,
          relevanceScore: Math.min(100, Math.max(0, rawScore)) // Normalize to 0-100
        };
      });
      
      // Fallback strategy: If no matches, progressively relax filters
      let finalGigs = gigsWithScore;
      
      if (finalGigs.length === 0 && allGigs.length > 0) {
        console.warn('⚠️ No gigs matched preferences, applying fallback strategy...');
        
        // Try without location filter
        let fallbackGigs = [...allGigs];
        
        if (preferences.serviceType && preferences.serviceType.trim() !== '') {
          fallbackGigs = fallbackGigs.filter(gig => {
            const gigCategory = (gig.category || '').toLowerCase();
            const prefServiceType = preferences.serviceType.toLowerCase();
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
        
        // If still no matches, just return top-rated gigs
        if (fallbackGigs.length === 0) {
          console.warn('⚠️ Still no matches, returning top-rated gigs from all categories');
          fallbackGigs = [...allGigs];
        }
        
        // Calculate scores for fallback gigs
        finalGigs = fallbackGigs.map(gig => {
          const rawScore = (
            (gig.caregiverRating || 0) * 20 +
            (gig.caregiverReviewCount || 0) * 0.5 +
            (gig.caregiverIsVerified ? 15 : 0) +
            (gig.caregiverExperience || 0) * 2
          );
          return {
            ...gig,
            relevanceScore: Math.min(100, Math.max(0, rawScore))
          };
        });
        
        console.log(`✅ Fallback strategy found ${finalGigs.length} gigs`);
      }
      
      // Sort by relevance score (highest first)
      finalGigs.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Transform to expected recommendation format and limit to top 10
      // Include all props needed by ServiceCard component
      const recommendations = finalGigs.slice(0, 10).map(gig => ({
        // Core gig fields (original)
        id: gig.id,
        title: gig.title || 'Untitled Service',
        image1: gig.gigImage || gig.image1 || 'https://via.placeholder.com/380x200?text=Care+Service',
        packageDetails: gig.packageDetails || gig.description || 'Professional care service',
        price: parseFloat(gig.price) || 0,
        priceUnit: gig.priceUnit || 'hour',
        category: gig.category || 'General Care',
        tags: gig.tags || [],
        
        // Caregiver fields for ServiceCard
        caregiverName: gig.caregiverName || 'Unknown Provider',
        caregiverFirstName: gig.caregiverFirstName || '',
        caregiverLastName: gig.caregiverLastName || '',
        caregiverProfileImage: gig.caregiverProfileImage || '',
        caregiverLocation: gig.caregiverLocation || 'Location not specified',
        rating: parseFloat(gig.caregiverRating) || 0,
        reviewCount: parseInt(gig.caregiverReviewCount) || 0,
        isVerified: gig.caregiverIsVerified || false,
        isAvailable: gig.caregiverIsAvailable !== false,
        
        // Optional ServiceCard fields
        isPremium: false, // Can be enhanced based on gig data
        isPopular: (gig.caregiverReviewCount || 0) > 50, // Mark as popular if many reviews
        
        // Backward compatibility fields (for current custom cards)
        provider: gig.caregiverName || 'Unknown Provider',
        serviceType: gig.category || 'General Care',
        location: gig.caregiverLocation || 'Location not specified',
        image: gig.gigImage || gig.caregiverProfileImage || 'https://via.placeholder.com/150',
        
        // Additional enriched data
        caregiverId: gig.caregiverId || null,
        caregiverBio: gig.caregiverBio,
        caregiverExperience: gig.caregiverExperience,
        caregiverSpecializations: gig.caregiverSpecializations,
        description: gig.description,
        relevanceScore: gig.relevanceScore
      }));
      
      console.log(`✅ Generated ${recommendations.length} recommendations from ${allGigs.length} available gigs`);
      
      if (recommendations.length === 0) {
        console.warn('⚠️ No recommendations generated - check if gigs exist in database');
      }
      
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
