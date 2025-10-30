/**
 * Client Review Service
 * Handles review-related operations for clients
 */
import config from "../config"; // Centralized API configuration

const ClientReviewService = {
  /**
   * Get all completed orders for a client
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} - Array of completed order objects
   */
  async getCompletedOrders(clientId) {
    try {
      const API_URL = `${config.BASE_URL}/ClientOrders/clientUserId?clientUserId=${clientId}`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching orders: ${response.status}`);
      }
      
      const allOrders = await response.json();
      
      // Filter orders to only return those with status "Completed"
      const completedOrders = allOrders.filter(order => 
        order.clientOrderStatus && order.clientOrderStatus.toLowerCase() === 'completed'
      );
      
      return completedOrders;
    } catch (error) {
      console.error("Error in getCompletedOrders:", error);
      throw new Error(`Failed to fetch completed orders: ${error.message}`);
    }
  },

  /**
   * Get all orders for a client (all statuses)
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} - Array of all order objects
   */
  async getAllOrders(clientId) {
    try {
      const API_URL = `${config.BASE_URL}/ClientOrders/clientUserId?clientUserId=${clientId}`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching orders: ${response.status}`);
      }
      
      const orders = await response.json();
      return orders || [];
    } catch (error) {
      console.error("Error in getAllOrders:", error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  },

  /**
   * Get reviews for a specific order by gig ID
   * @param {string} gigId - The gig/order ID
   * @returns {Promise<Array>} - Array of review objects
   */
  async getReviewsForOrder(gigId) {
    try {
      const API_URL = `${config.BASE_URL}/Reviews?gigId=${gigId}`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching reviews: ${response.status}`);
      }
      
      const reviews = await response.json();
      return reviews || [];
      
    } catch (error) {
      console.error(`Error fetching reviews for gig ${gigId}:`, error);
      // Return empty array instead of throwing to allow the service to continue
      return [];
    }
  },

  /**
   * Get reviews for orders of a client
   * @param {string} clientId - The client's ID
   * @param {boolean} completedOnly - Whether to fetch only completed orders (default: true)
   * @returns {Promise<Array>} - Array containing orders with their reviews
   */
  async getAllClientReviews(clientId, completedOnly = true) {
    try {
      const orders = completedOnly 
        ? await this.getCompletedOrders(clientId)
        : await this.getAllOrders(clientId);
      
      const ordersWithReviews = [];
      
      for (const order of orders) {
        const reviews = await this.getReviewsForOrder(order.id);
        ordersWithReviews.push({
          ...order,
          reviews: reviews
        });
      }
      
      return ordersWithReviews;
    } catch (error) {
      console.error("Error in getAllClientReviews:", error);
      throw new Error(`Failed to fetch client reviews: ${error.message}`);
    }
  },

  /**
   * Create a rating distribution analysis from orders
   * @param {Array} orders - Array of order objects with rating field
   * @returns {Object} - Rating distribution and statistics
   */
  createRatingDistribution(orders) {
    try {
      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      
      let totalReviews = 0;
      let totalRatingSum = 0;
      
      orders.forEach(order => {
        if (order.rating && order.rating >= 1 && order.rating <= 5) {
          const rating = Math.floor(order.rating); // Ensure integer rating
          distribution[rating]++;
          totalReviews++;
          totalRatingSum += order.rating;
        }
      });
      
      const averageRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(2) : 0;
      
      // Calculate percentages
      const distributionWithPercentages = {};
      for (let rating = 1; rating <= 5; rating++) {
        distributionWithPercentages[rating] = {
          count: distribution[rating],
          percentage: totalReviews > 0 ? ((distribution[rating] / totalReviews) * 100).toFixed(1) : 0
        };
      }
      
      return {
        distribution: distributionWithPercentages,
        totalReviews: totalReviews,
        averageRating: parseFloat(averageRating),
        summary: {
          excellent: distribution[5], // 5 stars
          good: distribution[4],      // 4 stars
          average: distribution[3],   // 3 stars
          poor: distribution[2],      // 2 stars
          terrible: distribution[1]   // 1 star
        }
      };
    } catch (error) {
      console.error("Error in createRatingDistribution:", error);
      return {
        distribution: { 1: { count: 0, percentage: 0 }, 2: { count: 0, percentage: 0 }, 3: { count: 0, percentage: 0 }, 4: { count: 0, percentage: 0 }, 5: { count: 0, percentage: 0 } },
        totalReviews: 0,
        averageRating: 0,
        summary: { excellent: 0, good: 0, average: 0, poor: 0, terrible: 0 }
      };
    }
  },

  /**
   * Get comprehensive review analysis for a client
   * @param {string} clientId - The client's ID
   * @param {boolean} completedOnly - Whether to analyze only completed orders (default: true)
   * @returns {Promise<Object>} - Complete review analysis including distribution and reviews
   */
  async getClientReviewAnalysis(clientId, completedOnly = true) {
    try {
      const ordersWithReviews = await this.getAllClientReviews(clientId, completedOnly);
      const ratingDistribution = this.createRatingDistribution(ordersWithReviews);
      
      return {
        orders: ordersWithReviews,
        analysis: ratingDistribution,
        metadata: {
          totalOrders: ordersWithReviews.length,
          ordersWithRatings: ordersWithReviews.filter(order => order.rating).length,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("Error in getClientReviewAnalysis:", error);
      throw new Error(`Failed to generate review analysis: ${error.message}`);
    }
  }
};

export default ClientReviewService;