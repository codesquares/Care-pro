/**
 * Contract Service
 * Handles contract-related operations for clients
 */
import config from "../config"; // Centralized API configuration

const ContractService = {
  /**
   * Generate contract from an existing order
   * @param {string} orderId - The order ID to generate contract from
   * @returns {Promise<Object>} - Contract generation result
   */
  async generateContractFromOrder(orderId) {
    try {
      // Validate parameter
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/generate-from-order/${orderId}`;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to generate contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData
      };

    } catch (error) {
      console.error("Error in generateContractFromOrder:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while generating contract'
      };
    }
  },

  /**
   * Check if contract already exists for an order
   * @param {string} orderId - The order ID to check
   * @returns {Promise<Object>} - Contract check result
   */
  async checkExistingContract(orderId) {
    try {
      // Validate parameter
      if (!orderId) {
        return {
          success: false,
          error: 'Order ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/by-order/${orderId}`;
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 404) {
        // No contract exists - this is expected for orders without contracts
        return {
          success: true,
          data: null,
          hasContract: false
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to check contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData,
        hasContract: true
      };

    } catch (error) {
      console.error("Error in checkExistingContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while checking contract'
      };
    }
  },

  /**
   * Get contract details by contract ID
   * @param {string} contractId - The contract ID
   * @returns {Promise<Object>} - Contract details result
   */
  async getContractById(contractId) {
    try {
      // Validate parameter
      if (!contractId) {
        return {
          success: false,
          error: 'Contract ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}`;
      
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
          error: errorData.message || `Failed to get contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData
      };

    } catch (error) {
      console.error("Error in getContractById:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching contract'
      };
    }
  },

  /**
   * Get all contracts for a client
   * @param {string} clientId - The client ID
   * @returns {Promise<Object>} - Contracts list result
   */
  async getClientContracts(clientId) {
    try {
      // Validate parameter
      if (!clientId) {
        return {
          success: false,
          error: 'Client ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/client/${clientId}`;
      
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
          error: errorData.message || `Failed to get contracts: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractsData = await response.json();
      return {
        success: true,
        data: contractsData || []
      };

    } catch (error) {
      console.error("Error in getClientContracts:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching contracts'
      };
    }
  },

  /**
   * Helper function to determine if an order can generate a contract
   * @param {Object} order - Order object
   * @param {Object|null} existingContract - Existing contract data or null
   * @param {boolean} hasOrderTasks - Whether OrderTasks exist for this order
   * @returns {boolean} - Whether contract can be generated
   */
  canGenerateContract(order, existingContract = null, hasOrderTasks = false) {
    if (!order) return false;
    
    // Check if order exists and has transaction ID (is paid)
    const isPaid = !!(order.transactionId || order.paymentTransactionId);
    
    // Check if no contract exists
    const hasNoContract = !existingContract;
    
    // Check if order is not cancelled
    const isNotCancelled = order.clientOrderStatus !== 'Cancelled';
    
    // Check if OrderTasks exist
    const hasRequiredOrderTasks = hasOrderTasks;
    
    return isPaid && hasNoContract && isNotCancelled && hasRequiredOrderTasks;
  },

  /**
   * Get contract generation requirements
   * @param {Object} order - Order object
   * @param {Object|null} existingContract - Existing contract data or null
   * @param {boolean} hasOrderTasks - Whether OrderTasks exist for this order
   * @returns {Object} - Requirements and missing items
   */
  getContractRequirements(order, existingContract = null, hasOrderTasks = false) {
    if (!order) return { canGenerate: false, missing: ['Order data'] };
    
    const missing = [];
    
    if (!order.transactionId && !order.paymentTransactionId) {
      missing.push('Payment completion');
    }
    
    if (existingContract) {
      missing.push('Contract already exists');
    }
    
    if (order.clientOrderStatus === 'Cancelled') {
      missing.push('Order is cancelled');
    }
    
    if (!hasOrderTasks) {
      missing.push('Order task requirements');
    }
    
    return {
      canGenerate: missing.length === 0,
      missing: missing
    };
  },

  /**
   * Format contract display data
   * @param {Object} contract - Contract object
   * @returns {Object} - Formatted contract data
   */
  formatContractForDisplay(contract) {
    if (!contract) return null;

    return {
      id: contract.id,
      status: contract.status || 'Unknown',
      totalAmount: contract.totalAmount || 0,
      createdAt: contract.createdAt ? new Date(contract.createdAt).toLocaleString() : 'Unknown',
      sentAt: contract.sentAt ? new Date(contract.sentAt).toLocaleString() : null,
      contractStartDate: contract.contractStartDate ? new Date(contract.contractStartDate).toLocaleDateString() : null,
      contractEndDate: contract.contractEndDate ? new Date(contract.contractEndDate).toLocaleDateString() : null,
      packageDetails: contract.selectedPackage || null,
      tasks: contract.tasks || []
    };
  },

  // ==========================================
  // CAREGIVER-SPECIFIC CONTRACT FUNCTIONS
  // ==========================================

  /**
   * Accept a contract (caregiver action)
   * @param {string} contractId - The contract ID to accept
   * @returns {Promise<Object>} - Contract acceptance result
   */
  async acceptContract(contractId) {
    try {
      // Validate parameter
      if (!contractId) {
        return {
          success: false,
          error: 'Contract ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/accept`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to accept contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData
      };

    } catch (error) {
      console.error("Error in acceptContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while accepting contract'
      };
    }
  },

  /**
   * Reject a contract (caregiver action)
   * @param {string} contractId - The contract ID to reject
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} - Contract rejection result
   */
  async rejectContract(contractId, reason = '') {
    try {
      // Validate parameters
      if (!contractId) {
        return {
          success: false,
          error: 'Contract ID is required'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/reject`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to reject contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData
      };

    } catch (error) {
      console.error("Error in rejectContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while rejecting contract'
      };
    }
  },

  /**
   * Request contract review (caregiver action)
   * @param {string} contractId - The contract ID to request review for
   * @param {string} comments - Comments for review request
   * @returns {Promise<Object>} - Contract review request result
   */
  async requestContractReview(contractId, comments = '') {
    try {
      // Validate parameters
      if (!contractId) {
        return {
          success: false,
          error: 'Contract ID is required'
        };
      }

      if (!comments.trim()) {
        return {
          success: false,
          error: 'Comments are required for review requests'
        };
      }

      // Get auth token for authenticated request
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/request-review`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ comments: comments.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to request contract review: ${response.status}`,
          statusCode: response.status
        };
      }

      const contractData = await response.json();
      return {
        success: true,
        data: contractData
      };

    } catch (error) {
      console.error("Error in requestContractReview:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while requesting contract review'
      };
    }
  },

  /**
   * Get contract status options for caregiver
   * @returns {Array} - Array of available status options
   */
  getCaregiverContractStatuses() {
    return [
      { value: 'Sent', label: 'Pending Review', color: '#ffa726' },
      { value: 'Accepted', label: 'Accepted', color: '#66bb6a' },
      { value: 'Rejected', label: 'Rejected', color: '#f44336' },
      { value: 'Review Requested', label: 'Review Requested', color: '#42a5f5' },
      { value: 'Under Review', label: 'Under Review', color: '#ab47bc' }
    ];
  },

  /**
   * Check if caregiver can take action on contract
   * @param {Object} contract - Contract object
   * @returns {Object} - Available actions
   */
  getCaregiverContractActions(contract) {
    if (!contract) {
      return {
        canAccept: false,
        canReject: false,
        canRequestReview: false,
        canRead: false
      };
    }

    const status = contract.status?.toLowerCase();
    
    return {
      canAccept: status === 'sent' || status === 'pending',
      canReject: status === 'sent' || status === 'pending',
      canRequestReview: status === 'sent' || status === 'pending',
      canRead: true
    };
  }
};

export default ContractService;