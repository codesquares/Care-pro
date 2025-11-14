/**
 * OrderTasks Service
 * Handles OrderTasks-related operations for clients
 */
import config from "../config"; // Centralized API configuration

const OrderTasksService = {
  /**
   * Create OrderTasks for an existing order
   * @param {Object} orderTasksData - OrderTasks data object
   * @returns {Promise<Object>} - OrderTasks creation result
   */
  async createOrderTasks(orderTasksData) {
    try {
      // Validate required fields
      if (!orderTasksData.clientId || !orderTasksData.gigId || !orderTasksData.caregiverId) {
        return {
          success: false,
          error: 'Missing required fields: clientId, gigId, caregiverId'
        };
      }

      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/OrderTasks`;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderTasksData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to create OrderTasks: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error("Error in createOrderTasks:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while creating OrderTasks'
      };
    }
  },

  /**
   * Check if OrderTasks exist for an order
   * @param {string} orderId - The order ID to check
   * @returns {Promise<Object>} - OrderTasks check result
   */
  async checkOrderTasks(orderId) {
    try {
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/OrderTasks/by-order/${orderId}`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 404) {
        return {
          success: true,
          data: null,
          hasOrderTasks: false
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to check OrderTasks: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        hasOrderTasks: true
      };

    } catch (error) {
      console.error("Error in checkOrderTasks:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while checking OrderTasks'
      };
    }
  },

  /**
   * Get OrderTasks by ID
   * @param {string} orderTasksId - The OrderTasks ID
   * @returns {Promise<Object>} - OrderTasks details result
   */
  async getOrderTasksById(orderTasksId) {
    try {
      if (!orderTasksId) {
        return {
          success: false,
          error: 'OrderTasks ID is required'
        };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/OrderTasks/${orderTasksId}`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to get OrderTasks: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error("Error in getOrderTasksById:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching OrderTasks'
      };
    }
  },

  /**
   * Get all OrderTasks for a client
   * @param {string} clientId - The client ID
   * @returns {Promise<Object>} - OrderTasks list result
   */
  async getClientOrderTasks(clientId) {
    try {
      if (!clientId) {
        return {
          success: false,
          error: 'Client ID is required'
        };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/OrderTasks/my-orders`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to get OrderTasks: ${response.status}`,
          statusCode: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error("Error in getClientOrderTasks:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching OrderTasks'
      };
    }
  }
};

export default OrderTasksService;