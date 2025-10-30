/**
 * Client Order Service
 * Handles order-related operations for clients
 */
import config from "../config"; // Centralized API configuration

const ClientOrderService = {
  /**
   * Get order history for a client
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} - Array of order objects
   */
  async getOrderHistory(clientId) {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      const API_URL = `${config.BASE_URL}/ClientOrders/clientUserId?clientUserId=${clientId}`; // Using centralized API config
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error fetching order history: ${response.status}`);
      }
      
      const data = await response.json();
      return data || [];
      
    } catch (error) {
      console.error("Error in getOrderHistory:", error);
      // Return mock data as fallback
      return this.getMockOrders();
    }
  },
  
  /**
   * Calculate spending metrics from orders
   * @param {Array} orders - Array of order objects
   * @returns {Object} - Object containing spending metrics
   */
  calculateSpendingMetrics(orders) {
    if (!orders || orders.length === 0) {
      return {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        average: 0,
        categories: {}
      };
    }
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const metrics = {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      categories: {}
    };
    
    orders.forEach(order => {
      // Handle both orderDate and createdAt
      const orderDate = new Date(order.orderDate || order.createdAt);
      // Handle both amount and amount
      const amount = parseFloat(order.amount) || 0;
      
      // Total spending
      metrics.total += amount;
      
      // This month spending
      if (orderDate >= thisMonthStart && orderDate <= now) {
        metrics.thisMonth += amount;
      }
      
      // Last month spending
      if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
        metrics.lastMonth += amount;
      }
      
      // Categories spending - handle both serviceType and category
      const category = order.serviceType || order.category;
      if (category) {
        if (!metrics.categories[category]) {
          metrics.categories[category] = 0;
        }
        metrics.categories[category] += amount;
      }
    });
    
    // Calculate average monthly spending over the span of orders
    if (orders.length > 0) {
      const dates = orders.map(o => new Date(o.orderDate || o.createdAt)).sort();
      const firstOrderDate = dates[0];
      const lastOrderDate = dates[dates.length - 1];
      
      // Calculate months between first and last order
      const monthsDiff = (lastOrderDate.getFullYear() - firstOrderDate.getFullYear()) * 12 + 
                        (lastOrderDate.getMonth() - firstOrderDate.getMonth()) + 1;
      
      metrics.average = parseFloat((metrics.total / Math.max(1, monthsDiff)).toFixed(2));
    } else {
      metrics.average = 0;
    }
    
    return metrics;
  },

  /**
   * Create a new order
   * @param {Object} orderData - Order data object
   * @returns {Promise<Object>} - Result object with success status
   */
  async createOrder(orderData) {
    try {
      // Validate required fields
      if (!orderData.serviceType || !orderData.providerId || !orderData.amount) {
        return {
          success: false,
          error: 'Missing required fields: serviceType, providerId, amount'
        };
      }

      const API_URL = `${config.BASE_URL}/ClientOrders`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to create order: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error("Error in createOrder:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} - Result object with success status
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      // Validate parameters
      if (!orderId || !newStatus) {
        return {
          success: false,
          error: 'Order ID and status are required'
        };
      }

      const API_URL = `${config.BASE_URL}/ClientOrders/${orderId}/status`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update order status: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error("Error in updateOrderStatus:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Result object with success status
   */
  async cancelOrder(orderId) {
    try {
      // Validate parameter
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      const API_URL = `${config.BASE_URL}/ClientOrders/${orderId}/cancel`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to cancel order: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} - Result object with success status
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      // Validate parameters
      if (!orderId || !newStatus) {
        return {
          success: false,
          error: 'Order ID and status are required'
        };
      }

      const API_URL = `${config.BASE_URL}/ClientOrders/${orderId}/status`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to update order status: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error("Error in updateOrderStatus:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Result object with success status
   */
  async cancelOrder(orderId) {
    try {
      // Validate parameter
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      const API_URL = `${config.BASE_URL}/ClientOrders/${orderId}/cancel`; // Using centralized API config
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to cancel order: ${response.status}`
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get mock orders for testing
   * @returns {Array} - Array of mock order objects
   */
  getMockOrders() {
    return [
      {
        id: "ord-001",
        orderNumber: "ORD-2025-001",
        orderDate: "2025-05-01T10:00:00",
        serviceType: "Home Care",
        providerName: "Maria Johnson",
        amount: 120.00,
        status: "Completed",
        rating: 5
      },
      {
        id: "ord-002",
        orderNumber: "ORD-2025-002",
        orderDate: "2025-04-22T14:30:00",
        serviceType: "Elder Care",
        providerName: "John Smith",
        amount: 180.00,
        status: "Completed",
        rating: 4
      },
      {
        id: "ord-003",
        orderNumber: "ORD-2025-003",
        orderDate: "2025-04-15T09:00:00",
        serviceType: "Home Care",
        providerName: "Maria Johnson",
        amount: 120.00,
        status: "Completed",
        rating: 5
      },
      {
        id: "ord-004",
        orderNumber: "ORD-2025-004",
        orderDate: "2025-03-28T16:00:00",
        serviceType: "Child Care",
        providerName: "Lisa Anderson",
        amount: 90.00,
        status: "Completed",
        rating: 4
      },
      {
        id: "ord-005",
        orderNumber: "ORD-2025-005",
        orderDate: "2025-03-15T11:00:00",
        serviceType: "Post-Surgery Care",
        providerName: "Robert Williams",
        amount: 220.00,
        status: "Completed",
        rating: 5
      }
    ];
  }
};

export default ClientOrderService;
