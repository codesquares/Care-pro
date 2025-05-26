/**
 * Client Gig Service
 * Handles all API calls and data processing for client gig services
 */
import axios from 'axios';

const BASE_API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api';

const ClientGigService = {
  /**
   * Get all available gig services
   * @returns {Promise<Array>} List of all gig services
   */
  async getAllGigs() {
    try {
      const response = await axios.get(`${BASE_API_URL}/Gigs`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all gigs:', error);
      return [];
    }
  },
  
  /**
   * Get most popular gig services
   * @param {number} limit - Maximum number of gigs to return
   * @returns {Promise<Array>} List of popular gig services
   */
  async getPopularGigs(limit = 6) {
    try {
      // In a real app, this would use a dedicated endpoint
      // For now, we'll simulate by getting all and filtering
      const response = await axios.get(`${BASE_API_URL}/Gigs`);
      const allGigs = response.data || [];
      
      // Sort by number of orders (popularity)
      // This is just a simulation - actual implementation would depend on your API
      const sortedGigs = [...allGigs].sort((a, b) => 
        (b.orderCount || 0) - (a.orderCount || 0)
      );
      
      return sortedGigs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular gigs:', error);
      return [];
    }
  },
  
  /**
   * Get top-rated gig services
   * @param {number} limit - Maximum number of gigs to return
   * @returns {Promise<Array>} List of top-rated gig services
   */
  async getTopRatedGigs(limit = 6) {
    try {
      // In a real app, this would use a dedicated endpoint
      const response = await axios.get(`${BASE_API_URL}/Gigs`);
      const allGigs = response.data || [];
      
      // Sort by rating
      const sortedGigs = [...allGigs].sort((a, b) => 
        (b.rating || 0) - (a.rating || 0)
      );
      
      return sortedGigs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top rated gigs:', error);
      return [];
    }
  },
  
  /**
   * Apply advanced filters to gig services
   * @param {Array} services - List of gig services to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered list of gig services
   */
  applyAdvancedFilters(services, filters) {
    if (!services || !Array.isArray(services)) {
      return [];
    }
    
    let filteredServices = [...services];
    
    // Filter by service type (category)
    if (filters.serviceType) {
      filteredServices = filteredServices.filter(service => 
        service.category === filters.serviceType || 
        service.subCategory === filters.serviceType
      );
    }
    
    // Filter by location
    if (filters.location) {
      filteredServices = filteredServices.filter(service => 
        service.location === filters.location || 
        service.serviceArea?.includes(filters.location)
      );
    }
    
    // Filter by minimum rating
    if (filters.minRating) {
      const minRatingValue = parseFloat(filters.minRating);
      filteredServices = filteredServices.filter(service => 
        (service.rating || 0) >= minRatingValue
      );
    }
    
    // Filter by price range
    if (filters.priceRange) {
      if (filters.priceRange.min) {
        const minPrice = parseFloat(filters.priceRange.min);
        filteredServices = filteredServices.filter(service => 
          (service.price || 0) >= minPrice
        );
      }
      
      if (filters.priceRange.max) {
        const maxPrice = parseFloat(filters.priceRange.max);
        filteredServices = filteredServices.filter(service => 
          (service.price || 0) <= maxPrice
        );
      }
    }
    
    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'popularity':
          filteredServices.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
          break;
        case 'rating-high':
          filteredServices.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'rating-low':
          filteredServices.sort((a, b) => (a.rating || 0) - (b.rating || 0));
          break;
        case 'price-high':
          filteredServices.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'price-low':
          filteredServices.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'newest':
          filteredServices.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          break;
        default:
          // Default sort (by id or popularity)
          break;
      }
    }
    
    return filteredServices;
  }
};

export default ClientGigService;
