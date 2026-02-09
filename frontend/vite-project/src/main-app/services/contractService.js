/**
 * Contract Service
 * Handles contract-related operations for clients and caregivers
 * 
 * NEW FLOW (Caregiver-Initiated):
 * 1. Client creates order (payment completed)
 * 2. Client & Caregiver communicate via chat
 * 3. They agree on schedule (which days, times - 4-6 hrs each)
 * 4. Caregiver clicks "Generate Contract" on the order
 * 5. Contract sent to Client for approval (Round 1)
 * 6. Client can APPROVE or REQUEST REVIEW
 * 7. If review requested, Caregiver revises (Round 2)
 * 8. Client MUST either APPROVE or REJECT
 */
import config from "../config"; // Centralized API configuration

const ContractService = {
  // ==========================================
  // CAREGIVER CONTRACT GENERATION (NEW FLOW)
  // ==========================================

  /**
   * Generate contract as caregiver (NEW - Caregiver initiates)
   * @param {Object} contractData - Contract generation data
   * @param {string} contractData.orderId - The order ID
   * @param {Array} contractData.schedule - Array of scheduled visits [{dayOfWeek, startTime, endTime}]
   * @param {string} contractData.serviceAddress - Service address
   * @param {string} contractData.specialClientRequirements - Special requirements
   * @param {string} contractData.accessInstructions - Access instructions
   * @param {string} contractData.additionalNotes - Additional notes
   * @returns {Promise<Object>} - Contract generation result
   */
  async generateContractAsCaregiver(contractData) {
    try {
      // Validate required parameters
      if (!contractData?.orderId) {
        return { success: false, error: 'Order ID is required' };
      }
      if (!contractData?.schedule || !Array.isArray(contractData.schedule) || contractData.schedule.length === 0) {
        return { success: false, error: 'Schedule is required with at least one visit' };
      }
      if (!contractData?.serviceAddress?.trim()) {
        return { success: false, error: 'Service address is required' };
      }

      // Validate each schedule entry
      for (const visit of contractData.schedule) {
        if (!visit.dayOfWeek || !visit.startTime || !visit.endTime) {
          return { success: false, error: 'Each visit must have dayOfWeek, startTime, and endTime' };
        }
        // Validate duration is 4-6 hours
        const duration = this.calculateVisitDuration(visit.startTime, visit.endTime);
        if (duration < 4 || duration > 6) {
          return { success: false, error: `Visit on ${visit.dayOfWeek} must be between 4 and 6 hours (currently ${duration} hours)` };
        }
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/caregiver/generate`;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          orderId: contractData.orderId,
          schedule: contractData.schedule,
          serviceAddress: contractData.serviceAddress.trim(),
          specialClientRequirements: contractData.specialClientRequirements?.trim() || '',
          accessInstructions: contractData.accessInstructions?.trim() || '',
          additionalNotes: contractData.additionalNotes?.trim() || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to generate contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error("Error in generateContractAsCaregiver:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while generating contract'
      };
    }
  },

  /**
   * Revise contract as caregiver (when client requests review)
   * @param {Object} revisionData - Contract revision data
   * @param {string} revisionData.contractId - The contract ID
   * @param {Array} revisionData.revisedSchedule - Updated schedule
   * @param {string} revisionData.serviceAddress - Updated service address
   * @param {string} revisionData.specialClientRequirements - Updated requirements
   * @param {string} revisionData.accessInstructions - Updated access instructions
   * @param {string} revisionData.additionalNotes - Updated notes
   * @param {string} revisionData.revisionNotes - Notes about what changed
   * @returns {Promise<Object>} - Contract revision result
   */
  async reviseContract(revisionData) {
    try {
      if (!revisionData?.contractId) {
        return { success: false, error: 'Contract ID is required' };
      }
      if (!revisionData?.revisedSchedule || !Array.isArray(revisionData.revisedSchedule) || revisionData.revisedSchedule.length === 0) {
        return { success: false, error: 'Revised schedule is required' };
      }

      // Validate each schedule entry
      for (const visit of revisionData.revisedSchedule) {
        if (!visit.dayOfWeek || !visit.startTime || !visit.endTime) {
          return { success: false, error: 'Each visit must have dayOfWeek, startTime, and endTime' };
        }
        const duration = this.calculateVisitDuration(visit.startTime, visit.endTime);
        if (duration < 4 || duration > 6) {
          return { success: false, error: `Visit on ${visit.dayOfWeek} must be between 4 and 6 hours (currently ${duration} hours)` };
        }
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/caregiver/revise`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          contractId: revisionData.contractId,
          revisedSchedule: revisionData.revisedSchedule,
          serviceAddress: revisionData.serviceAddress?.trim() || '',
          specialClientRequirements: revisionData.specialClientRequirements?.trim() || '',
          accessInstructions: revisionData.accessInstructions?.trim() || '',
          additionalNotes: revisionData.additionalNotes?.trim() || '',
          revisionNotes: revisionData.revisionNotes?.trim() || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to revise contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error("Error in reviseContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while revising contract'
      };
    }
  },

  /**
   * Calculate visit duration in hours
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @returns {number} - Duration in hours
   */
  calculateVisitDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  },

  // ==========================================
  // CLIENT CONTRACT ACTIONS (NEW FLOW)
  // ==========================================

  /**
   * Get pending contracts for client approval
   * @param {string} clientId - The client ID
   * @returns {Promise<Object>} - Pending contracts list
   */
  async getClientPendingContracts(clientId) {
    try {
      if (!clientId) {
        return { success: false, error: 'Client ID is required' };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/client/${clientId}/pending-approval`;
      
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
          error: errorData.message || `Failed to get pending contracts: ${response.status}`,
          statusCode: response.status
        };
      }

      const contracts = await response.json();
      return { success: true, data: contracts || [] };

    } catch (error) {
      console.error("Error in getClientPendingContracts:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching pending contracts'
      };
    }
  },

  /**
   * Client approves a contract
   * @param {string} contractId - The contract ID to approve
   * @returns {Promise<Object>} - Approval result
   */
  async clientApproveContract(contractId) {
    try {
      if (!contractId) {
        return { success: false, error: 'Contract ID is required' };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/client-approve`;
      
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
          error: errorData.message || `Failed to approve contract: ${response.status}`,
          statusCode: response.status
        };
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error("Error in clientApproveContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while approving contract'
      };
    }
  },

  /**
   * Client requests review/changes (Round 1 only)
   * @param {string} contractId - The contract ID
   * @param {Object} reviewData - Review request data
   * @param {string} reviewData.comments - Comments for caregiver
   * @param {string} reviewData.preferredScheduleNotes - Preferred schedule notes
   * @returns {Promise<Object>} - Review request result
   */
  async clientRequestReview(contractId, reviewData) {
    try {
      if (!contractId) {
        return { success: false, error: 'Contract ID is required' };
      }
      if (!reviewData?.comments?.trim()) {
        return { success: false, error: 'Comments are required when requesting changes' };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/client-request-review`;
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          comments: reviewData.comments.trim(),
          preferredScheduleNotes: reviewData.preferredScheduleNotes?.trim() || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to request review: ${response.status}`,
          statusCode: response.status
        };
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error("Error in clientRequestReview:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while requesting review'
      };
    }
  },

  /**
   * Client rejects contract (Round 2 only - after revision)
   * @param {string} contractId - The contract ID to reject
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} - Rejection result
   */
  async clientRejectContract(contractId, reason) {
    try {
      if (!contractId) {
        return { success: false, error: 'Contract ID is required' };
      }
      if (!reason?.trim()) {
        return { success: false, error: 'Reason is required when rejecting a contract' };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/client-reject`;
      
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

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error("Error in clientRejectContract:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while rejecting contract'
      };
    }
  },

  /**
   * Get contract negotiation history (audit trail)
   * @param {string} contractId - The contract ID
   * @returns {Promise<Object>} - Negotiation history
   */
  async getNegotiationHistory(contractId) {
    try {
      if (!contractId) {
        return { success: false, error: 'Contract ID is required' };
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        return { success: false, error: 'Authentication required' };
      }

      const API_URL = `${config.BASE_URL}/contracts/${contractId}/negotiation-history`;
      
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
          error: errorData.message || `Failed to get negotiation history: ${response.status}`,
          statusCode: response.status
        };
      }

      const history = await response.json();
      return { success: true, data: history || [] };

    } catch (error) {
      console.error("Error in getNegotiationHistory:", error);
      return {
        success: false,
        error: error.message || 'Network error occurred while fetching negotiation history'
      };
    }
  },

  // ==========================================
  // DEPRECATED - OLD FLOW (kept for backward compatibility)
  // ==========================================

  /**
   * @deprecated Use generateContractAsCaregiver instead. Old client-triggered generation.
   * Generate contract from an existing order
   * @param {string} orderId - The order ID to generate contract from
   * @returns {Promise<Object>} - Contract generation result
   */
  async generateContractFromOrder(orderId) {
    console.warn('DEPRECATED: generateContractFromOrder is deprecated. Use generateContractAsCaregiver instead.');
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
   * Format contract display data (updated for new fields)
   * @param {Object} contract - Contract object
   * @returns {Object} - Formatted contract data
   */
  formatContractForDisplay(contract) {
    if (!contract) return null;

    return {
      id: contract.id,
      orderId: contract.orderId,
      status: contract.status || 'Unknown',
      totalAmount: contract.totalAmount || 0,
      createdAt: contract.createdAt ? new Date(contract.createdAt).toLocaleString() : 'Unknown',
      sentAt: contract.sentAt ? new Date(contract.sentAt).toLocaleString() : null,
      submittedAt: contract.submittedAt ? new Date(contract.submittedAt).toLocaleString() : null,
      contractStartDate: contract.contractStartDate ? new Date(contract.contractStartDate).toLocaleDateString() : null,
      contractEndDate: contract.contractEndDate ? new Date(contract.contractEndDate).toLocaleDateString() : null,
      packageDetails: contract.selectedPackage || null,
      tasks: contract.tasks || [],
      // New caregiver-submitted fields
      schedule: contract.schedule || [],
      serviceAddress: contract.serviceAddress || '',
      specialClientRequirements: contract.specialClientRequirements || '',
      accessInstructions: contract.accessInstructions || '',
      caregiverAdditionalNotes: contract.caregiverAdditionalNotes || '',
      // New client approval tracking fields
      negotiationRound: contract.negotiationRound || 1,
      clientApprovedAt: contract.clientApprovedAt ? new Date(contract.clientApprovedAt).toLocaleString() : null,
      clientReviewRequestedAt: contract.clientReviewRequestedAt ? new Date(contract.clientReviewRequestedAt).toLocaleString() : null,
      clientReviewComments: contract.clientReviewComments || '',
      generatedTerms: contract.generatedTerms || ''
    };
  },

  // ==========================================
  // CAREGIVER-SPECIFIC CONTRACT FUNCTIONS (UPDATED)
  // ==========================================

  /**
   * Check if caregiver can generate a contract for an order
   * @param {Object} order - Order object
   * @param {Object|null} existingContract - Existing contract data or null
   * @returns {boolean} - Whether contract can be generated
   */
  canCaregiverGenerateContract(order, existingContract = null) {
    if (!order) return false;
    
    // Check if order is paid
    const isPaid = !!(order.transactionId || order.paymentTransactionId);
    
    // Check if no contract exists
    const hasNoContract = !existingContract;
    
    // Check if order is not cancelled
    const isNotCancelled = order.clientOrderStatus !== 'Cancelled';
    
    return isPaid && hasNoContract && isNotCancelled;
  },

  /**
   * Check if caregiver can revise a contract
   * @param {Object} contract - Contract object
   * @returns {boolean} - Whether contract can be revised
   */
  canCaregiverReviseContract(contract) {
    if (!contract) return false;
    const status = contract.status?.toLowerCase().replace(/\s+/g, '');
    return status === 'clientreviewrequested';
  },

  /**
   * @deprecated Use generateContractAsCaregiver instead. Old caregiver accept flow.
   * Accept a contract (caregiver action)
   * @param {string} contractId - The contract ID to accept
   * @returns {Promise<Object>} - Contract acceptance result
   */
  async acceptContract(contractId) {
    console.warn('DEPRECATED: acceptContract is deprecated. In the new flow, clients approve contracts.');
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
   * @deprecated Use clientRejectContract instead. Old caregiver reject flow.
   * Reject a contract (caregiver action)
   * @param {string} contractId - The contract ID to reject
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} - Contract rejection result
   */
  async rejectContract(contractId, reason = '') {
    console.warn('DEPRECATED: rejectContract is deprecated. In the new flow, clients reject contracts after Round 2.');
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
   * @deprecated Use clientRequestReview instead. Old caregiver review request flow.
   * Request contract review (caregiver action)
   * @param {string} contractId - The contract ID to request review for
   * @param {string} comments - Comments for review request
   * @returns {Promise<Object>} - Contract review request result
   */
  async requestContractReview(contractId, comments = '') {
    console.warn('DEPRECATED: requestContractReview is deprecated. In the new flow, clients request review.');
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
   * Get contract status options (UPDATED for new flow)
   * @returns {Array} - Array of available status options
   */
  getContractStatuses() {
    return [
      { value: 'Draft', label: 'Draft', color: '#9e9e9e' },
      { value: 'PendingClientApproval', label: 'Pending Approval', color: '#ffa726' },
      { value: 'ClientReviewRequested', label: 'Changes Requested', color: '#42a5f5' },
      { value: 'Revised', label: 'Revised', color: '#ab47bc' },
      { value: 'Approved', label: 'Approved', color: '#66bb6a' },
      { value: 'ClientRejected', label: 'Rejected', color: '#f44336' },
      { value: 'Expired', label: 'Expired', color: '#757575' },
      { value: 'Completed', label: 'Completed', color: '#4caf50' },
      { value: 'Terminated', label: 'Terminated', color: '#d32f2f' }
    ];
  },

  /**
   * @deprecated Use getContractStatuses instead.
   * Get contract status options for caregiver
   * @returns {Array} - Array of available status options
   */
  getCaregiverContractStatuses() {
    console.warn('DEPRECATED: getCaregiverContractStatuses is deprecated. Use getContractStatuses instead.');
    return this.getContractStatuses();
  },

  /**
   * Get available actions for caregiver on a contract (UPDATED)
   * @param {Object} contract - Contract object
   * @returns {Object} - Available actions
   */
  getCaregiverContractActions(contract) {
    if (!contract) {
      return {
        canGenerate: false,
        canRevise: false,
        canRead: false
      };
    }

    const status = contract.status?.toLowerCase().replace(/\s+/g, '');
    
    return {
      canGenerate: false, // Caregiver generates from order, not from existing contract
      canRevise: status === 'clientreviewrequested',
      canRead: true
    };
  },

  /**
   * Get available actions for client on a contract (NEW)
   * @param {Object} contract - Contract object
   * @returns {Object} - Available actions
   */
  getClientContractActions(contract) {
    if (!contract) {
      return {
        canApprove: false,
        canRequestReview: false,
        canReject: false,
        canRead: false
      };
    }

    const status = contract.status?.toLowerCase().replace(/\s+/g, '');
    const negotiationRound = contract.negotiationRound || 1;
    
    // Client can act when status is PendingClientApproval or Revised
    const canAct = status === 'pendingclientapproval' || status === 'revised';
    
    return {
      canApprove: canAct,
      canRequestReview: canAct && negotiationRound === 1, // Only in Round 1
      canReject: canAct && negotiationRound >= 2, // Only in Round 2+
      canRead: true
    };
  },

  /**
   * Get status display info
   * @param {string} status - Contract status
   * @returns {Object} - Status display info with label and color
   */
  getStatusDisplayInfo(status) {
    const statuses = this.getContractStatuses();
    const statusInfo = statuses.find(s => 
      s.value.toLowerCase() === status?.toLowerCase().replace(/\s+/g, '')
    );
    return statusInfo || { value: status, label: status, color: '#9e9e9e' };
  },

  /**
   * Format schedule for display
   * @param {Array} schedule - Array of scheduled visits
   * @returns {string} - Formatted schedule string
   */
  formatScheduleForDisplay(schedule) {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return 'No schedule set';
    }
    
    return schedule.map(visit => {
      const duration = this.calculateVisitDuration(visit.startTime, visit.endTime);
      return `${visit.dayOfWeek}: ${visit.startTime} - ${visit.endTime} (${duration}hrs)`;
    }).join(' | ');
  },

  /**
   * Get days of week options for schedule picker
   * @returns {Array} - Array of day options
   */
  getDaysOfWeek() {
    return [
      { value: 'Monday', label: 'Monday' },
      { value: 'Tuesday', label: 'Tuesday' },
      { value: 'Wednesday', label: 'Wednesday' },
      { value: 'Thursday', label: 'Thursday' },
      { value: 'Friday', label: 'Friday' },
      { value: 'Saturday', label: 'Saturday' },
      { value: 'Sunday', label: 'Sunday' }
    ];
  },

  /**
   * Generate time options for schedule picker (30-minute intervals)
   * @returns {Array} - Array of time options
   */
  getTimeOptions() {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const displayStr = this.formatTimeForDisplay(timeStr);
        times.push({ value: timeStr, label: displayStr });
      }
    }
    return times;
  },

  /**
   * Format time for display (12-hour format)
   * @param {string} time24 - Time in 24-hour format (HH:MM)
   * @returns {string} - Time in 12-hour format
   */
  formatTimeForDisplay(time24) {
    const [hour, min] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${min.toString().padStart(2, '0')} ${period}`;
  }
};

export default ContractService;