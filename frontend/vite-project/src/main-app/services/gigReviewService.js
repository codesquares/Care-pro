/**
 * Gig Review Service
 * Handles fetching and processing reviews for specific gigs
 */
import config from '../config';

const GigReviewService = {
  /**
   * Get all reviews for a specific gig
   * @param {string} gigId - The gig ID
   * @returns {Promise<Array>} Array of review objects
   */
  async getReviewsByGigId(gigId) {
    try {
      if (!gigId) {
        throw new Error('Gig ID is required');
      }

      const response = await fetch(`${config.BASE_URL}/Reviews?gigId=${gigId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No reviews found
        }
        throw new Error(`Error fetching reviews: ${response.status}`);
      }

      const reviews = await response.json();
      return reviews || [];
    } catch (error) {
      console.error(`Error fetching reviews for gig ${gigId}:`, error);
      return [];
    }
  },

  /**
   * Calculate rating distribution from reviews
   * @param {Array} reviews - Array of review objects
   * @returns {Object} Rating distribution and statistics
   */
  calculateRatingStats(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution,
        distributionPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    let totalRating = 0;

    reviews.forEach(review => {
      const rating = Math.round(review.rating || review.Rating || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
        totalRating += rating;
      }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;

    // Calculate percentages
    const distributionPercentages = {};
    for (let i = 1; i <= 5; i++) {
      distributionPercentages[i] = totalReviews > 0 
        ? Math.round((distribution[i] / totalReviews) * 100) 
        : 0;
    }

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      distribution,
      distributionPercentages
    };
  },

  /**
   * Format review data for display
   * @param {Object} review - Raw review object from API
   * @returns {Object} Formatted review object
   */
  formatReview(review) {
    return {
      id: review.reviewId || review.ReviewId,
      clientId: review.clientId || review.ClientId,
      clientName: review.clientName || review.ClientName || 'Anonymous',
      caregiverId: review.caregiverId || review.CaregiverId,
      caregiverName: review.caregiverName || review.CaregiverName,
      gigId: review.gigId || review.GigId,
      message: review.message || review.Message || '',
      rating: review.rating || review.Rating || 0,
      reviewedOn: review.reviewedOn || review.ReviewedOn
    };
  },

  /**
   * Get formatted reviews with stats for a gig
   * @param {string} gigId - The gig ID
   * @returns {Promise<Object>} Object containing formatted reviews and stats
   */
  async getReviewsWithStats(gigId) {
    const rawReviews = await this.getReviewsByGigId(gigId);
    const formattedReviews = rawReviews.map(review => this.formatReview(review));
    const stats = this.calculateRatingStats(rawReviews);

    return {
      reviews: formattedReviews,
      stats
    };
  },

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },

  /**
   * Generate star display string
   * @param {number} rating - Rating value (1-5)
   * @returns {string} Star emoji string
   */
  getStarDisplay(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }
};

export default GigReviewService;
