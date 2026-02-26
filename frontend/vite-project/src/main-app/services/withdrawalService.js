/**
 * Withdrawal Service (Caregiver)
 * Handles withdrawal request operations for caregivers.
 * Consumes the /api/WithdrawalRequests endpoints.
 */
import api from './api';

export const withdrawalService = {
  /**
   * Get withdrawal history for a caregiver.
   * @param {string} caregiverId
   * @returns {Promise<Array>} Array of WithdrawalRequestResponse
   */
  async getWithdrawalHistory(caregiverId) {
    try {
      const response = await api.get(`/WithdrawalRequests/caregiver/${caregiverId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      throw error;
    }
  },

  /**
   * Get caregiver-friendly withdrawal history (with Description/Activity fields).
   * @param {string} caregiverId
   * @returns {Promise<Array>} Array of CaregiverWithdrawalHistoryResponse
   */
  async getCaregiverWithdrawalHistory(caregiverId) {
    try {
      const response = await api.get(
        `/WithdrawalRequests/caregiver-withdrawal-history/${caregiverId}`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching caregiver withdrawal history:', error);
      throw error;
    }
  },

  /**
   * Check if caregiver has a pending withdrawal request.
   * @param {string} caregiverId
   * @returns {Promise<boolean>}
   */
  async hasPendingWithdrawal(caregiverId) {
    try {
      const response = await api.get(`/WithdrawalRequests/has-pending/${caregiverId}`);
      return response.data?.hasPendingRequest ?? false;
    } catch (error) {
      console.error('Error checking pending withdrawal:', error);
      return false;
    }
  },

  /**
   * Create a new withdrawal request.
   * Service charge is calculated server-side — do NOT send it from the client.
   * @param {{ caregiverId: string, amountRequested: number, accountNumber?: string, bankName?: string, accountName?: string }} withdrawalData
   * @returns {Promise<Object>} Created withdrawal request
   */
  async createWithdrawalRequest(withdrawalData) {
    if (!withdrawalData?.amountRequested || !withdrawalData?.caregiverId) {
      throw new Error('Invalid withdrawal data: caregiverId and amountRequested are required');
    }

    try {
      const response = await api.post('/WithdrawalRequests', {
        CaregiverId: withdrawalData.caregiverId,
        AmountRequested: withdrawalData.amountRequested,
        AccountNumber: withdrawalData.accountNumber || null,
        BankName: withdrawalData.bankName || null,
        AccountName: withdrawalData.accountName || null,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  },

  /**
   * Get a single withdrawal request by ID.
   * @param {string} withdrawalRequestId
   * @returns {Promise<Object>} WithdrawalRequestDTO
   */
  async getWithdrawalById(withdrawalRequestId) {
    try {
      const response = await api.get(`/WithdrawalRequests/${withdrawalRequestId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal request:', error);
      throw error;
    }
  },

  /**
   * Get total amount earned and withdrawn summary.
   * @param {string} caregiverId
   * @returns {Promise<Object>} { TotalAmountEarned, TotalAmountWithdrawn, WithdrawableAmount }
   */
  async getTotalAmountEarnedAndWithdrawn(caregiverId) {
    try {
      const response = await api.get(
        `/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${caregiverId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings/withdrawal summary:', error);
      throw error;
    }
  },
};

/**
 * Admin Withdrawal Service
 * Handles admin-side withdrawal request operations.
 * Consumes the /api/WithdrawalRequests admin endpoints.
 */
export const adminWithdrawalService = {
  /**
   * Get all withdrawal requests.
   * @returns {Promise<Array>}
   */
  async getAllWithdrawalRequests() {
    try {
      const response = await api.get('/WithdrawalRequests');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
      throw error;
    }
  },

  /**
   * Get withdrawal requests filtered by status.
   * @param {string} status - "Pending", "Verified", "Completed", "Rejected"
   * @returns {Promise<Array>}
   */
  async getWithdrawalRequestsByStatus(status) {
    try {
      const response = await api.get(`/WithdrawalRequests/status/${status}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching withdrawal requests by status:', error);
      throw error;
    }
  },

  /**
   * Get withdrawal request by token.
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async getWithdrawalRequestByToken(token) {
    try {
      const response = await api.get(`/WithdrawalRequests/token/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal request by token:', error);
      throw error;
    }
  },

  /**
   * Verify a withdrawal request (Admin).
   * AdminId is overridden by JWT on the server.
   * Sends withdrawalId (MongoDB _id string) — backend also accepts token if present.
   * @param {{ withdrawalId: string, adminNotes?: string }} verificationData
   * @returns {Promise<Object>}
   */
  async verifyWithdrawalRequest(verificationData) {
    const payload = {
      WithdrawalId: verificationData.withdrawalId,
      Token: verificationData.token || null,
      AdminNotes: verificationData.adminNotes || verificationData.AdminNotes || null,
    };
    try {
      const response = await api.post('/WithdrawalRequests/verify', payload);
      return response.data;
    } catch (error) {
      console.error('Error verifying withdrawal request:', error);
      throw error;
    }
  },

  /**
   * Complete a withdrawal request (Admin).
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async completeWithdrawalRequest(token) {
    try {
      const response = await api.post(`/WithdrawalRequests/complete/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error completing withdrawal request:', error);
      throw error;
    }
  },

  /**
   * Reject a withdrawal request (Admin).
   * AdminId is overridden by JWT on the server.
   * Sends withdrawalId (MongoDB _id string) — backend also accepts token if present.
   * @param {{ withdrawalId: string, adminNotes?: string }} rejectionData
   * @returns {Promise<Object>}
   */
  async rejectWithdrawalRequest(rejectionData) {
    const payload = {
      WithdrawalId: rejectionData.withdrawalId,
      Token: rejectionData.token || null,
      AdminNotes: rejectionData.adminNotes || rejectionData.AdminNotes || null,
    };
    try {
      const response = await api.post('/WithdrawalRequests/reject', payload);
      return response.data;
    } catch (error) {
      console.error('Error rejecting withdrawal request:', error);
      throw error;
    }
  },
};
