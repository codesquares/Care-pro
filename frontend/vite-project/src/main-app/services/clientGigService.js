/**
 * Client Gig Service
 * Handles all API calls and data processing for client gig services
 */
import axios from 'axios';

// import api from './api';
import config from '../config';

const BASE_API_URL = config.BASE_URL;

const ClientGigService = {
  /**
   * Get all available gig services
   * @returns {Promise<Array>} List of all gig services
   */
  // async getAllGigs() {
  //   try {
  //     const response = await axios.get(`${BASE_API_URL}/Gigs`);
  //     const userResponse = await axios.get(`${BASE_API_URL}/CareGivers/AllCaregivers`);
  //     // Combine gig services with user data and exclude any gig that does not have a caregiverId in the user data

  //     return response.data || [];
  //   } catch (error) {
  //     console.error('Error fetching all gigs:', error);
  //     return [];
  //   }
  // },
  
  async getAllGigs() {
  try {
    // Fetch all gigs and all caregivers in parallel for better performance
    const [response, userResponse] = await Promise.all([
      axios.get(`${BASE_API_URL}/Gigs`),
      axios.get(`${BASE_API_URL}/CareGivers/AllCaregivers`)
    ]);

    const allGigs = response.data || [];
    const allCaregivers = userResponse.data || [];

    // Create a map of caregiver data for faster lookup
    // This improves performance when matching gigs to caregivers
    const caregiverMap = new Map();
    allCaregivers.forEach(caregiver => {
      caregiverMap.set(caregiver.id, caregiver);
    });

    // Filter gigs to only include those with valid caregivers and published status
    // and enrich them with caregiver information
    const validAndEnrichedGigs = allGigs
      .filter(gig => {
        // Exclude gigs that don't have a caregiverId or whose caregiver doesn't exist
        // Also exclude gigs that are not published
        return gig.caregiverId && 
               caregiverMap.has(gig.caregiverId) && 
               gig.status === 'Published';
      })
      .map(gig => {
        // Get the corresponding caregiver data
        const caregiver = caregiverMap.get(gig.caregiverId);
        
        // Combine gig data with relevant caregiver information
        return {
          ...gig, // Keep all original gig properties
          
          // Add enriched caregiver data to the gig object
          caregiverName: caregiver.firstName && caregiver.lastName 
            ? `${caregiver.firstName} ${caregiver.lastName}` 
            : caregiver.fullName || 'Unknown Caregiver',
          
          caregiverFirstName: caregiver.firstName || '',
          caregiverLastName: caregiver.lastName || '',
          caregiverEmail: caregiver.email || '',
          caregiverPhone: caregiver.phoneNumber || '',
          gigImage:  gig.image1 || '',
          caregiverRating: caregiver.rating || 0,
          caregiverReviewCount: caregiver.reviewCount || 0,
          caregiverLocation: caregiver.location || caregiver.address || '',
          caregiverBio: caregiver.bio || caregiver.description || '',
          caregiverExperience: caregiver.yearsOfExperience || caregiver.experience || 0,
          caregiverSpecializations: caregiver.specializations || caregiver.skills || [],
          caregiverIsVerified: caregiver.isVerified || false,
          caregiverIsAvailable: caregiver.isAvailable !== false, // Default to true if not specified
          caregiverJoinDate: caregiver.createdAt || caregiver.joinDate || '',
          caregiverLanguages: caregiver.languages || [],
          caregiverCertifications: caregiver.certifications || [],
          
          // Keep the original caregiverId for reference
          originalCaregiverId: gig.caregiverId,
          caregiverProfileImage: caregiver.profileImage || "./avatar.jpg",
          introVideo:caregiver.introVideo || ""
        };
      });

    console.log(`Filtered ${validAndEnrichedGigs.length} valid gigs out of ${allGigs.length} total gigs`);
    console.log('Enriched gig data:', validAndEnrichedGigs);

    return validAndEnrichedGigs;
    
  } catch (error) {
    console.error('Error fetching and combining gigs with caregiver data:', error);
    
    // In case of error, still try to return basic gig data if available
    try {
      const fallbackResponse = await axios.get(`${BASE_API_URL}/Gigs`);
      console.warn('Returning basic gig data without caregiver enrichment due to error');
      return fallbackResponse.data || [];
    } catch (fallbackError) {
      console.error('Complete failure to fetch gigs:', fallbackError);
      return [];
    }
  }
},
  /**
   * Get most popular gig services
   * @param {number} limit - Maximum number of gigs to return
   * @returns {Promise<Array>} List of popular gig services
   */
  async getPopularGigs(limit = 6) {
    try {
      // Use getAllGigs to get enriched data with caregiver information
      const allEnrichedGigs = await this.getAllGigs();
      
      // Calculate popularity score using available fields
      // TODO: Add 'orderCount', 'viewCount', or 'bookingCount' fields to track actual popularity metrics
      // Current implementation uses caregiver rating * review count as popularity proxy
      const gigsWithPopularityScore = allEnrichedGigs.map(gig => ({
        ...gig,
        popularityScore: (gig.caregiverRating * gig.caregiverReviewCount) + 
                        (gig.caregiverIsVerified ? 10 : 0) + // Boost for verified caregivers
                        (gig.caregiverExperience * 2) // Boost for experience
      }));
      
      // Sort by popularity score (higher is better)
      const sortedGigs = gigsWithPopularityScore.sort((a, b) => 
        b.popularityScore - a.popularityScore
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
      // Use getAllGigs to get enriched data with caregiver information
      const allEnrichedGigs = await this.getAllGigs();
      
      // Filter to only include gigs with rated caregivers and sort by rating
      // TODO: Add 'gigRating' field to track ratings specific to individual gigs
      // Current implementation uses caregiverRating as the primary rating metric
      const ratedGigs = allEnrichedGigs
        .filter(gig => gig.caregiverRating > 0) // Only include gigs with rated caregivers
        .sort((a, b) => {
          // Primary sort by caregiver rating (descending)
          if (a.caregiverRating !== b.caregiverRating) {
            return b.caregiverRating - a.caregiverRating;
          }
          // Secondary sort by review count for tie-breaking (more reviews = more credible)
          return b.caregiverReviewCount - a.caregiverReviewCount;
        });
      
      return ratedGigs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top rated gigs:', error);
      return [];
    }
  },
  
  /**
   * Apply search functionality to gig services
   * @param {Array} services - List of enriched gig services from getAllGigs()
   * @param {string} searchTerm - Search term to filter by
   * @returns {Array} Filtered list of gig services based on search
   */
  applySearch(services, searchTerm) {
    if (!services || !Array.isArray(services) || !searchTerm || searchTerm.trim() === '') {
      return services;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return services.filter(service => {
      // Search across multiple fields for comprehensive results
      const searchableFields = [
        service.title || '',
        service.description || '',
        service.category || '',
        service.subCategory || '',
        service.caregiverName || '',
        service.caregiverFirstName || '',
        service.caregiverLastName || '',
        service.caregiverLocation || '',
        service.caregiverBio || '',
        service.serviceArea || '',
        service.packageType || '',
        ...(service.caregiverSpecializations || []),
        ...(service.caregiverLanguages || []),
        ...(service.caregiverCertifications || [])
      ];

      // Check if any field contains the search term
      return searchableFields.some(field => {
        if (typeof field === 'string') {
          return field.toLowerCase().includes(normalizedSearchTerm);
        } else if (Array.isArray(field)) {
          return field.some(item => 
            typeof item === 'string' && item.toLowerCase().includes(normalizedSearchTerm)
          );
        }
        return false;
      });
    });
  },

  /**
   * Apply advanced filters to gig services
   * @param {Array} services - List of enriched gig services from getAllGigs()
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered list of gig services
   */
  applyAdvancedFilters(services, filters) {
    if (!services || !Array.isArray(services)) {
      return [];
    }
    
    let filteredServices = [...services];

    // Apply search filter first if searchTerm exists
    if (filters.searchTerm) {
      filteredServices = this.applySearch(filteredServices, filters.searchTerm);
    }
    
    // Filter by service type (category or subcategory)
    if (filters.serviceType) {
      filteredServices = filteredServices.filter(service => 
        service.category === filters.serviceType || 
        (service.subCategory && service.subCategory.includes(filters.serviceType))
      );
    }
    
    // Enhanced location filtering using both gig and caregiver location
    // TODO: Populate caregiverLocation field - many entries are empty
    if (filters.location) {
      filteredServices = filteredServices.filter(service => 
        service.caregiverLocation === filters.location ||
        service.caregiverLocation.toLowerCase().includes(filters.location.toLowerCase()) ||
        service.serviceArea?.includes(filters.location)
      );
    }
    
    // Enhanced rating filtering using caregiver rating
    if (filters.minRating) {
      const minRatingValue = parseFloat(filters.minRating);
      filteredServices = filteredServices.filter(service => 
        (service.caregiverRating || 0) >= minRatingValue
      );
    }
    
    // Price range filtering
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
    
    // New filter: Verified caregivers only
    if (filters.verifiedOnly) {
      filteredServices = filteredServices.filter(service => 
        service.caregiverIsVerified === true
      );
    }
    
    // New filter: Available caregivers only
    if (filters.availableOnly) {
      filteredServices = filteredServices.filter(service => 
        service.caregiverIsAvailable === true
      );
    }
    
    // New filter: Minimum experience years
    if (filters.minExperience) {
      const minExp = parseFloat(filters.minExperience);
      filteredServices = filteredServices.filter(service => 
        (service.caregiverExperience || 0) >= minExp
      );
    }
    
    // New filter: By caregiver specializations
    if (filters.specializations && filters.specializations.length > 0) {
      filteredServices = filteredServices.filter(service =>
        filters.specializations.some(spec =>
          service.caregiverSpecializations.includes(spec)
        )
      );
    }
    
    // New filter: By package type
    if (filters.packageType) {
      filteredServices = filteredServices.filter(service => 
        service.packageType === filters.packageType
      );
    }
    
    // Enhanced sorting with new options
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'popularity':
          // TODO: Add orderCount/bookingCount for true popularity metrics
          // Current implementation uses composite popularity score
          filteredServices.sort((a, b) => {
            const scoreA = (a.caregiverRating * a.caregiverReviewCount) + 
                          (a.caregiverIsVerified ? 10 : 0) + 
                          (a.caregiverExperience * 2);
            const scoreB = (b.caregiverRating * b.caregiverReviewCount) + 
                          (b.caregiverIsVerified ? 10 : 0) + 
                          (b.caregiverExperience * 2);
            return scoreB - scoreA;
          });
          break;
        case 'rating-high':
          filteredServices.sort((a, b) => (b.caregiverRating || 0) - (a.caregiverRating || 0));
          break;
        case 'rating-low':
          filteredServices.sort((a, b) => (a.caregiverRating || 0) - (b.caregiverRating || 0));
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
        case 'experience-high':
          filteredServices.sort((a, b) => (b.caregiverExperience || 0) - (a.caregiverExperience || 0));
          break;
        case 'experience-low':
          filteredServices.sort((a, b) => (a.caregiverExperience || 0) - (b.caregiverExperience || 0));
          break;
        case 'most-reviewed':
          filteredServices.sort((a, b) => (b.caregiverReviewCount || 0) - (a.caregiverReviewCount || 0));
          break;
        case 'verified-first':
          filteredServices.sort((a, b) => {
            if (a.caregiverIsVerified === b.caregiverIsVerified) {
              return (b.caregiverRating || 0) - (a.caregiverRating || 0);
            }
            return b.caregiverIsVerified - a.caregiverIsVerified;
          });
          break;
        default:
          // Default sort by rating then by review count
          filteredServices.sort((a, b) => {
            if ((b.caregiverRating || 0) !== (a.caregiverRating || 0)) {
              return (b.caregiverRating || 0) - (a.caregiverRating || 0);
            }
            return (b.caregiverReviewCount || 0) - (a.caregiverReviewCount || 0);
          });
          break;
      }
    }
    
    return filteredServices;
  },
 
  
};

export default ClientGigService;
