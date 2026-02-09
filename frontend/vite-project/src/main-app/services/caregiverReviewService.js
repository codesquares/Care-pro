/**
 * Caregiver Review Service
 * Handles fetching and processing caregiver gigs with their associated reviews
 */
import api from './api';

import config from '../config';

const BASE_API_URL = config.BASE_URL;

// Cache for client profiles to avoid duplicate API calls
const clientProfileCache = new Map();

const CaregiverReviewService = {
  /**
   * Get all gigs for a caregiver with their associated reviews and enriched data
   * @param {string} caregiverId - The caregiver's ID
   * @returns {Promise<Array>} Array of review objects with enriched data
   */
  async getGigsWithReviews(caregiverId) {
    try {
      if (!caregiverId) {
        throw new Error('Caregiver ID is required');
      }

      // Step 1: Fetch caregiver's gigs and caregiver profile in parallel
      const [gigsResponse, caregiverResponse] = await Promise.allSettled([
        api.get(`/Gigs/caregiver/${caregiverId}`),
        api.get(`/CareGivers/${caregiverId}`)
      ]);

      // Handle potential failures
      const gigs = gigsResponse.status === 'fulfilled' && gigsResponse.value.status === 200 
        ? gigsResponse.value.data 
        : [];
      const caregiverProfile = caregiverResponse.status === 'fulfilled' && caregiverResponse.value.status === 200 
        ? caregiverResponse.value.data 
        : null;

      if (!gigs || gigs.length === 0) {
        return [];
      }

      // Step 2: Fetch reviews for all gigs in parallel
      const reviewPromises = gigs.map(gig =>
        api.get(`/Reviews?gigId=${gig.id}`)
          .then(response => {
            if (response.status === 200) {
              return {
                gigId: gig.id,
                gig: gig,
                reviews: response.data || []
              };
            }
            throw new Error(`API returned status ${response.status}`);
          })
          .catch(error => {
            console.warn(`Failed to fetch reviews for gig ${gig.id}:`, error);
            return {
              gigId: gig.id,
              gig: gig,
              reviews: []
            };
          })
      );

      const gigReviewsData = await Promise.allSettled(reviewPromises);
      const validGigReviews = gigReviewsData
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      // Flatten all reviews and collect unique client IDs
      const allReviews = [];
      const uniqueClientIds = new Set();

      validGigReviews.forEach(({ gig, reviews }) => {
        reviews.forEach(review => {
          allReviews.push({ ...review, gig });
          if (review.clientId) {
            uniqueClientIds.add(review.clientId);
          }
        });
      });

      if (allReviews.length === 0) {
        return [];
      }

      // Step 3: Fetch client profiles for unique client IDs
      const clientProfiles = await this.fetchClientProfiles(Array.from(uniqueClientIds));

      // Step 4: Enrich reviews with complete data
      const enrichedReviews = allReviews.map(review => {
        const clientProfile = clientProfiles.get(review.clientId);
        
        return {
          // Review core data
          id: review.reviewId,
          rating: review.rating || 5,
          comment: review.message || review.comment || '',
          createdAt: review.reviewedOn,
          
          // Gig information
          gig: {
            id: review.gig.id,
            title: review.gig.title,
            category: review.gig.category,
            packageType: review.gig.packageType,
            packageName: review.gig.packageName,
            price: review.gig.price
          },
          
          // Client information (with fallbacks)
          client: {
            id: review.clientId,
            name: review.clientName || this.formatClientName(clientProfile),
            profileImage: this.getClientProfileImage(clientProfile, review.clientName),
            email: clientProfile?.email
          },
          
          // Caregiver information
          caregiver: {
            id: review.caregiverId,
            name: review.caregiverName || this.formatCaregiverName(caregiverProfile),
            profileImage: this.getCaregiverProfileImage(caregiverProfile, review.caregiverName)
          }
        };
      });

      // Sort reviews by date (newest first)
      enrichedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return enrichedReviews;

    } catch (error) {
      console.error('Error fetching gigs with reviews:', error);
      throw error;
    }
  },

  /**
   * Fetch client profiles in batches with caching
   * @param {Array<string>} clientIds - Array of client IDs
   * @returns {Promise<Map>} Map of client profiles by ID
   */
  async fetchClientProfiles(clientIds) {
    const clientProfiles = new Map();
    const idsToFetch = [];

    // Check cache first
    clientIds.forEach(clientId => {
      if (clientProfileCache.has(clientId)) {
        clientProfiles.set(clientId, clientProfileCache.get(clientId));
      } else {
        idsToFetch.push(clientId);
      }
    });

    if (idsToFetch.length === 0) {
      return clientProfiles;
    }

    // Fetch uncached profiles in parallel (with reasonable concurrency limit)
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < idsToFetch.length; i += batchSize) {
      batches.push(idsToFetch.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const profilePromises = batch.map(clientId =>
        api.get(`/Clients/${clientId}`)
          .then(response => {
            if (response.status === 200) {
              return { clientId, profile: response.data };
            }
            throw new Error(`API returned status ${response.status}`);
          })
          .catch(error => {
            console.warn(`Failed to fetch client profile for ${clientId}:`, error);
            return { clientId, profile: null };
          })
      );

      const results = await Promise.allSettled(profilePromises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { clientId, profile } = result.value;
          clientProfiles.set(clientId, profile);
          clientProfileCache.set(clientId, profile); // Cache for future use
        }
      });
    }

    return clientProfiles;
  },

  /**
   * Generate avatar URL using ui-avatars.com
   * @param {string} name - The name for the avatar
   * @returns {string} Avatar URL
   */
  generateAvatarUrl(name) {
    const encodedName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?name=${encodedName}&background=3b82f6&color=ffffff&size=48&rounded=true`;
  },

  /**
   * Format client name from profile data
   * @param {Object} clientProfile - Client profile object
   * @returns {string} Formatted name
   */
  formatClientName(clientProfile) {
    if (!clientProfile) return 'Anonymous Client';
    
    const { firstName, middleName, lastName } = clientProfile;
    const nameParts = [firstName, middleName, lastName].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join(' ') : 'Anonymous Client';
  },

  /**
   * Format caregiver name from profile data
   * @param {Object} caregiverProfile - Caregiver profile object
   * @returns {string} Formatted name
   */
  formatCaregiverName(caregiverProfile) {
    if (!caregiverProfile) return 'Caregiver';
    
    const { firstName, middleName, lastName } = caregiverProfile;
    const nameParts = [firstName, middleName, lastName].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join(' ') : 'Caregiver';
  },

  /**
   * Get client profile image with fallback
   * @param {Object} clientProfile - Client profile object
   * @param {string} fallbackName - Fallback name for avatar
   * @returns {string} Profile image URL
   */
  getClientProfileImage(clientProfile, fallbackName) {
    if (clientProfile?.profileImage) {
      return clientProfile.profileImage;
    }
    
    const name = this.formatClientName(clientProfile) || fallbackName || 'Client';
    return this.generateAvatarUrl(name);
  },

  /**
   * Get caregiver profile image with fallback
   * @param {Object} caregiverProfile - Caregiver profile object
   * @param {string} fallbackName - Fallback name for avatar
   * @returns {string} Profile image URL
   */
  getCaregiverProfileImage(caregiverProfile, fallbackName) {
    if (caregiverProfile?.profileImage) {
      return caregiverProfile.profileImage;
    }
    
    const name = this.formatCaregiverName(caregiverProfile) || fallbackName || 'Caregiver';
    return this.generateAvatarUrl(name);
  },

  /**
   * Calculate statistics for reviews
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Review statistics
   */
  calculateReviewStats(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = review.rating || 5;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      ratingDistribution
    };
  },

  /**
   * Filter reviews by rating
   * @param {Array} reviews - Array of review objects
   * @param {number} rating - Rating to filter by (1-5)
   * @returns {Array} Filtered reviews
   */
  filterReviewsByRating(reviews, rating) {
    if (!reviews || !rating) return reviews;
    return reviews.filter(review => review.rating === rating);
  },

  /**
   * Clear client profile cache (useful for memory management)
   */
  clearCache() {
    clientProfileCache.clear();
  }
};

export default CaregiverReviewService;