/**
 * GigMatchingService
 * Handles matching gigs to clients based on their preferences and needs
 */
import config from "../config"; // Centralized API configuration

class GigMatchingService {
  /**
   * Get relevant gigs for a client 
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} List of matched gigs
   */
  static async getRelevantGigs(clientId) {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found, using mock data');
        return this.getMockRelevantGigs();
      }
      
      // First, try to use our new dedicated recommendation endpoint
      const API_URL = `${config.BASE_URL}/Recommendations/gigs/${clientId}`; // Using centralized API config
      
      // Use timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 second timeout
      
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data) && data.length > 0) {
            console.log('Using recommendations from dedicated API');
            return data;
          }
        } else {
          console.warn(`API returned ${response.status}, trying fallback approach`);
        }
        
        // Fallback: get all gigs and filter based on client preferences
        try {
          // Get client preferences
          const prefResponse = await fetch(`${config.BASE_URL}/ClientPreferences/clientId?clientId=${clientId}`, { // Using centralized API config
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          let preferences = {};
          if (prefResponse.ok) {
            const prefData = await prefResponse.json();
            if (prefData && prefData.data) {
              // Parse preferences
              preferences = this.parsePreferencesData(prefData.data);
            }
          } else if (prefResponse.status === 404) {
            console.log('No client preferences found, using basic matching');
            preferences = {}; // Use empty preferences for basic matching
          } else {
            console.warn(`Failed to fetch client preferences: ${prefResponse.status}`);
            preferences = {}; // Use empty preferences as fallback
          }
          
          // Get all gigs
          const gigsResponse = await fetch(`${config.BASE_URL}/Gigs`, { // Using centralized API config
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (gigsResponse.ok) {
            const gigsData = await gigsResponse.json();
            if (gigsData && Array.isArray(gigsData)) {
              console.log('Using manual filtering based on preferences');
              return this.filterGigsByPreferences(gigsData, preferences);
            }
          }
        } catch (fallbackError) {
          console.error('Error in fallback approach:', fallbackError);
        }
        
        return this.getMockRelevantGigs();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('API request timed out, using mock data');
        } else {
          console.error('Error fetching gigs:', fetchError);
        }
        return this.getMockRelevantGigs();
      }
    } catch (error) {
      console.error('Error in getRelevantGigs:', error);
      return this.getMockRelevantGigs();
    }
  }
  
  /**
   * Parse preferences data from API format
   * @param {Array<string>} preferencesData - Array of preference strings
   * @returns {Object} Parsed preferences object
   */
  static parsePreferencesData(preferencesData) {
    const preferences = {};
    
    if (Array.isArray(preferencesData)) {
      preferencesData.forEach(item => {
        const colonIndex = item.indexOf(':');
        if (colonIndex > -1) {
          const key = item.substring(0, colonIndex);
          let value = item.substring(colonIndex + 1);
          
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If not valid JSON, use as is
          }
          
          if (key.includes('.')) {
            // Handle nested properties
            const [parentKey, childKey] = key.split('.');
            if (!preferences[parentKey]) {
              preferences[parentKey] = {};
            }
            preferences[parentKey][childKey] = value;
          } else {
            preferences[key] = value;
          }
        }
      });
    }
    
    return preferences;
  }
  
  /**
   * Filter gigs based on client preferences
   * @param {Array<Object>} gigs - All available gigs
   * @param {Object} preferences - Client preferences
   * @returns {Array<Object>} Filtered and ranked gigs
   */
  static filterGigsByPreferences(gigs, preferences) {
    if (!gigs || !Array.isArray(gigs)) {
      return [];
    }
    
    return gigs
      .filter(gig => gig.status === 'published') // Only published gigs
      .map(gig => {
        let matchScore = 0;
        let maxPossibleScore = 0;
        const matchDetails = [];
        
        // Match service type
        if (preferences.serviceType && gig.category === preferences.serviceType) {
          matchScore += 25;
          matchDetails.push(`Matches needed service: ${gig.category}`);
        }
        maxPossibleScore += 25;
        
        // Match location
        if (preferences.location && gig.location === preferences.location) {
          matchScore += 20;
          matchDetails.push(`Located in ${gig.location}`);
        }
        maxPossibleScore += 20;
        
        // Match budget
        if (preferences.budget && preferences.budget.min && preferences.budget.max) {
          const minBudget = parseFloat(preferences.budget.min);
          const maxBudget = parseFloat(preferences.budget.max);
          const gigPrice = gig.price || 0;
          
          if (gigPrice >= minBudget && gigPrice <= maxBudget) {
            matchScore += 15;
            matchDetails.push(`Price ($${gigPrice}) within budget`);
          }
        }
        maxPossibleScore += 15;
        
        // Calculate percentage match (minimum 50%)
        const percentMatch = Math.max(50, Math.round((matchScore / maxPossibleScore) * 100));
        
        // Return gig with match details
        return {
          id: gig.id,
          title: gig.title,
          description: gig.description,
          serviceType: gig.category || gig.subCategory,
          location: gig.location || 'Unknown',
          schedule: gig.availabilitySchedule || 'flexible',
          payRate: gig.price || 0,
          matchScore: percentMatch,
          matchDetails: matchDetails
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score (highest first)
  }
  
  /**
   * Get mock relevant gigs
   * @returns {Array} List of mock gigs
   */
  static getMockRelevantGigs() {
    return [
      {
        id: 'gig-1',
        title: 'Elder Care Assistance',
        description: 'Looking for compassionate caregiver for elderly father with mild dementia',
        serviceType: 'Elder Care',
        location: 'Lagos',
        schedule: 'weekday-mornings',
        frequency: 'weekly',
        payRate: 28,
        duration: '4 hours',
        requiredSkills: ['Dementia Care', 'Medication Management'],
        matchScore: 95,
        matchDetails: ['Matches your elder care needs', 'Located in Lagos', 'Rate within budget']
      },
      {
        id: 'gig-2',
        title: 'Special Needs Child Support',
        description: 'Seeking experienced caregiver for 8-year-old with autism',
        serviceType: 'Special Needs Care',
        location: 'Abuja',
        schedule: 'afternoons',
        frequency: 'daily',
        payRate: 32,
        duration: '3 hours',
        requiredSkills: ['Autism Support', 'Behavioral Management'],
        matchScore: 82,
        matchDetails: ['Matches your special needs care interest', 'Rate within budget']
      },
      {
        id: 'gig-3',
        title: 'Post-Surgery Recovery Help',
        description: 'Need assistance with recovery after knee surgery',
        serviceType: 'Post-Surgery Care',
        location: 'Lagos',
        schedule: 'flexible',
        frequency: 'as-needed',
        payRate: 30,
        duration: 'varies',
        requiredSkills: ['Physical Therapy', 'Mobility Assistance'],
        matchScore: 78,
        matchDetails: ['Located in Lagos', 'Flexible schedule']
      }
    ];
  }
}

export default GigMatchingService;
