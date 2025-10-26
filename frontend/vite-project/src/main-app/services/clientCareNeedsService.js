/**
 * Client Care Needs Service
 * Handles all API calls related to client care needs
 */
class ClientCareNeedsService {
  /**
   * Get care needs for the current user
   * @returns {Promise<Object>} Care needs data
   */
  static async getCareNeeds() {
    try {
      // For demo purposes, get from localStorage
      // const storedNeeds = localStorage.getItem('careNeeds');
      
      // if (storedNeeds) {
      //   return JSON.parse(storedNeeds);
      // }
      
      // Get the current client ID
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const clientId = userDetails.id;
      
      if (clientId) {
        // Try to fetch from API first
        try {
          const token = localStorage.getItem('authToken');
          const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/ClientPreferences/clientId?clientId=${clientId}`;
          
          const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Convert the API format (array of strings) to object format
            if (data && data.data && Array.isArray(data.data)) {
              const careNeeds = this.convertApiDataToCareNeeds(data.data);
              return careNeeds;
            }
          } else if (response.status === 404) {
            // 404 is expected when user hasn't set preferences yet
            console.log('No preferences found for user, using defaults');
          } else {
            console.warn(`API returned ${response.status}, using default care needs`);
          }
        } catch (apiError) {
          console.warn('API call failed, using default care needs:', apiError);
        }
      }
      
      // Default care needs if none found
      return {
        primaryCondition: '',
        additionalConditions: [],
        mobilityLevel: '',
        assistanceLevel: '',
        dietaryRestrictions: [],
        medicationManagement: false,
        frequentMonitoring: false,
        specialEquipment: [],
        additionalNotes: ''
      };
    } catch (error) {
      console.error('Error in getCareNeeds:', error);
      throw error;
    }
  }
  
  /**
   * Save care needs for the current user
   * @param {Object} careNeeds - Care needs data to save
   * @returns {Promise<Object>} Updated care needs data
   */
  static async saveCareNeeds(careNeeds) {
    try {
      // For demo purposes, save to localStorage
      localStorage.setItem('careNeeds', JSON.stringify(careNeeds));
      
      // Get the current client ID
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const clientId = userDetails.id;
      
      if (clientId) {
        // Try to save to API
        try {
          const token = localStorage.getItem('authToken');
          const API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api/ClientPreferences';
          
          // Convert careNeeds object to the format expected by the API
          const preferencesData = this.convertCareNeedsToApiData(careNeeds);
          
          const payload = {
            clientId: clientId,
            data: preferencesData
          };
          
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            console.warn(`API returned ${response.status} when saving care needs`);
          } else {
            console.log('Care needs saved to API successfully');
            return careNeeds;
          }
        } catch (apiError) {
          console.warn('API call failed, care needs saved locally only:', apiError);
        }
      }
      
      return careNeeds;
    } catch (error) {
      console.error('Error in saveCareNeeds:', error);
      throw error;
    }
  }
  
  /**
   * Convert care needs object to API data format
   * @param {Object} careNeeds - Care needs object
   * @returns {Array} Array of serialized data strings for API
   */
  static convertCareNeedsToApiData(careNeeds) {
    const dataArray = [];
    
    // Process each property in the care needs object
    Object.entries(careNeeds).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          dataArray.push(`${key}:${JSON.stringify(value)}`);
        } else {
          // For nested objects
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            dataArray.push(`${key}.${nestedKey}:${JSON.stringify(nestedValue)}`);
          });
        }
      } else {
        // For simple key-value pairs
        dataArray.push(`${key}:${JSON.stringify(value)}`);
      }
    });
    
    return dataArray;
  }
  
  /**
   * Convert API data format to care needs object
   * @param {Array} dataArray - Array of serialized data strings from API
   * @returns {Object} Care needs object
   */
  static convertApiDataToCareNeeds(dataArray) {
    const careNeeds = {
      primaryCondition: '',
      additionalConditions: [],
      mobilityLevel: '',
      assistanceLevel: '',
      dietaryRestrictions: [],
      medicationManagement: false,
      frequentMonitoring: false,
      specialEquipment: [],
      additionalNotes: ''
    };
    
    dataArray.forEach(item => {
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
          if (!careNeeds[parentKey]) {
            careNeeds[parentKey] = {};
          }
          careNeeds[parentKey][childKey] = value;
        } else {
          careNeeds[key] = value;
        }
      }
    });
    
    return careNeeds;
  }
  
  /**
   * Get caregiver matching recommendations based on care needs
   * @param {Object} careNeeds - Care needs to match against
   * @returns {Promise<Array>} List of recommended caregivers
   */
  static async getMatchingCaregivers(careNeeds) {
    try {
      if (!careNeeds || !careNeeds.primaryCondition) {
        return [];
      }
      
      // Get the current client ID
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const clientId = userDetails.id;
      
      if (clientId) {
        // If we have the MatchingService, use it for better recommendations
        try {
          // Dynamically import MatchingService to avoid circular dependencies
          const { default: MatchingService } = await import('./matchingService');
          return await MatchingService.getRecommendedCaregivers(clientId);
        } catch (matchingError) {
          console.warn('MatchingService not available, using fallback method:', matchingError);
        }
      }
      
      // Fallback to mock recommendations
      return [
        {
          id: 'cg-1',
          name: 'Sarah Johnson',
          rating: 4.9,
          specialties: ['Elder Care', 'Medication Management'],
          yearsExperience: 5,
          hourlyRate: 25,
          matchScore: 95
        },
        {
          id: 'cg-2',
          name: 'Michael Chen',
          rating: 4.7,
          specialties: ['Post-Surgery Care', 'Physical Therapy'],
          yearsExperience: 3,
          hourlyRate: 30,
          matchScore: 87
        },
        {
          id: 'cg-3',
          name: 'Aisha Williams',
          rating: 4.8,
          specialties: ['Special Needs Care', 'Pediatric Care'],
          yearsExperience: 7,
          hourlyRate: 28,
          matchScore: 82
        }
      ];
    } catch (error) {
      console.error('Error in getMatchingCaregivers:', error);
      throw error;
    }
  }
  
  /**
   * Get relevant gigs based on client care needs
   * @param {string} clientId - Client ID
   * @returns {Promise<Array>} List of relevant gigs
   */
  static async getRelevantGigs(clientId) {
    try {
      // If we have the MatchingService, use it for better recommendations
      try {
        // Dynamically import MatchingService to avoid circular dependencies
        const { default: MatchingService } = await import('./matchingService');
        return await MatchingService.getRecommendedGigs(clientId);
      } catch (matchingError) {
        console.warn('MatchingService not available, using fallback method:', matchingError);
      }
      
      // Fallback to mock data
      return [
        {
          id: 'gig-1',
          title: 'Elder Care Assistance',
          description: 'Looking for compassionate caregiver',
          location: 'Lagos',
          payRate: 28,
          matchScore: 90
        },
        {
          id: 'gig-2',
          title: 'Special Needs Support',
          description: 'Seeking experienced caregiver',
          location: 'Abuja',
          payRate: 32,
          matchScore: 85
        },
        {
          id: 'gig-3',
          title: 'Post-Surgery Recovery',
          description: 'Need assistance with recovery',
          location: 'Lagos',
          payRate: 30,
          matchScore: 80
        }
      ];
    } catch (error) {
      console.error('Error in getRelevantGigs:', error);
      throw error;
    }
  }
}

export default ClientCareNeedsService;
