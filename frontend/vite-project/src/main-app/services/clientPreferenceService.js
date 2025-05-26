/**
 * Client Preference Service
 * Handles client service preferences and recommendation operations
 */
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
    
      // In a real implementation, this would make an API call
      const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/Clients/${clientId}/preferences`;
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error fetching preferences: ${response.status}`);
      }
      
      const data = await response.json();
      return data || this.getDefaultPreferences();
      
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
      
      // In a real implementation, this would make an API call
      const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/Clients/${clientId}/preferences`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error(`Error saving preferences: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error("Error in savePreferences:", error);
      // Return the preferences that were attempted to be saved
      return preferences;
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
      // In a real implementation, this would make an API call to a recommendation engine
      // For now, return mock recommendations
      return this.getMockRecommendations(preferences);
      
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      return [];
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
   * Get mock recommendations based on preferences
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
