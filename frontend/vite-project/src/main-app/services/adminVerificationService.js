import api from './api';

const adminVerificationService = {
  /**
   * Get all pending verifications requiring admin review
   * @returns {Promise<Object>} Response with verifications array
   */
  getPendingVerifications: async () => {
    try {
      const response = await api.get('/Admin/Verifications/PendingReviews');
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'No data received'
      };
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      return {
        success: false,
        error: error.response?.data?.Message || error.response?.data?.message || error.message || 'Failed to fetch verifications'
      };
    }
  },

  /**
   * Get detailed webhook data for a specific verification
   * @param {string} webhookLogId - The webhook log ID
   * @returns {Promise<Object>} Response with parsed webhook data
   */
  getWebhookDetails: async (webhookLogId) => {
    try {
      if (!webhookLogId || webhookLogId.trim() === '') {
        return {
          success: false,
          error: 'Webhook log ID is required'
        };
      }

      const response = await api.get(`/Admin/Verifications/WebhookDetails/${webhookLogId}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'No webhook data found'
      };
    } catch (error) {
      console.error('Error fetching webhook details:', error);
      return {
        success: false,
        error: error.response?.data?.Message || error.response?.data?.message || error.message || 'Failed to fetch webhook details'
      };
    }
  },

  /**
   * Admin review and decision on a verification
   * @param {Object} reviewData - Review data
   * @param {string} reviewData.verificationId - Verification ID
   * @param {string} reviewData.adminId - Admin ID
   * @param {string} reviewData.decision - 'Approve' or 'Reject'
   * @param {string} reviewData.adminNotes - Optional notes
   * @param {string} reviewData.reviewedWebhookLogId - Optional webhook log ID
   * @returns {Promise<Object>} Response with success status
   */
  reviewVerification: async (reviewData) => {
    try {
      if (!reviewData.verificationId) {
        return {
          success: false,
          error: 'Verification ID is required'
        };
      }

      if (!reviewData.adminId) {
        return {
          success: false,
          error: 'Admin ID is required'
        };
      }

      if (!reviewData.decision || !['Approve', 'Reject'].includes(reviewData.decision)) {
        return {
          success: false,
          error: 'Decision must be either "Approve" or "Reject"'
        };
      }

      // Validate rejection has notes
      if (reviewData.decision === 'Reject' && !reviewData.adminNotes?.trim()) {
        return {
          success: false,
          error: 'Admin notes are required for rejection'
        };
      }

      const requestBody = {
        VerificationId: reviewData.verificationId,
        AdminId: reviewData.adminId,
        Decision: reviewData.decision,
        AdminNotes: reviewData.adminNotes || '',
        ReviewedWebhookLogId: reviewData.reviewedWebhookLogId || ''
      };

      console.log('Submitting verification review:', requestBody);

      const response = await api.put('/Admin/Verifications/Review', requestBody);
      
      if (response.data && response.data.Success) {
        return {
          success: true,
          message: response.data.Message || 'Verification reviewed successfully',
          newStatus: response.data.NewStatus,
          verificationId: response.data.VerificationId
        };
      }
      
      return {
        success: false,
        error: response.data?.Message || 'Failed to review verification'
      };
    } catch (error) {
      console.error('Error reviewing verification:', error);
      console.error('Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.Message || error.response?.data?.message || error.message || 'Failed to review verification'
      };
    }
  },

  /**
   * Get webhook history for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Response with webhook logs array
   */
  getUserWebhookHistory: async (userId) => {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const response = await api.get(`/Admin/Verifications/WebhookLogs/User/${userId}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'No webhook logs found'
      };
    } catch (error) {
      console.error('Error fetching user webhook history:', error);
      return {
        success: false,
        error: error.response?.data?.Message || error.response?.data?.message || error.message || 'Failed to fetch webhook history'
      };
    }
  }
};

export default adminVerificationService;
