import api from './api';

/**
 * @typedef {"Completed"|"Verified"|"Success"|"Failed"|"Pending"} AdminOverrideStatus
 */

/**
 * @typedef {Object} AdminVerificationStatusOverrideRequest
 * @property {string} verificationId
 * @property {string} adminId
 * @property {AdminOverrideStatus} newStatus
 * @property {string} reason - min 5 chars, audit trail
 */

/**
 * @typedef {Object} AdminVerificationStatusOverrideResponse
 * @property {boolean} success
 * @property {string} [verificationId]
 * @property {string} [previousStatus]
 * @property {string} [newStatus]
 * @property {boolean} [isVerified]
 * @property {string} [message]
 * @property {string} [error]
 */

/**
 * @typedef {Object} AdminUpdateCaregiverNameRequest
 * @property {string} caregiverId
 * @property {string} adminId
 * @property {string} firstName
 * @property {string|null} [middleName]
 * @property {string} lastName
 * @property {true} confirmed - server-side safety latch; must be true
 * @property {string} reason - min 5 chars, audit trail
 */

/**
 * @typedef {Object} AdminUpdateCaregiverNameResponse
 * @property {boolean} success
 * @property {string} [caregiverId]
 * @property {string} [previousFirstName]
 * @property {string|null} [previousMiddleName]
 * @property {string} [previousLastName]
 * @property {string} [newFirstName]
 * @property {string|null} [newMiddleName]
 * @property {string} [newLastName]
 * @property {boolean} [appUserUpdated]
 * @property {string} [message]
 * @property {string} [error]
 */

const ALLOWED_OVERRIDE_STATUSES = ['Completed', 'Verified', 'Success', 'Failed', 'Pending'];
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

/**
 * Returns true when the value looks like a 24-char hex MongoDB ObjectId.
 * Older Verification.UserId values may have been stored as an email; callers
 * should fall back to an email lookup in that case.
 * @param {string} value
 * @returns {boolean}
 */
const isObjectId = (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value.trim());

const adminVerificationService = {
  isObjectId,
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
  },

  /**
   * Admin escape-hatch: override a verification's status (e.g. Failed -> Completed).
   * Backend route: PUT /api/Admin/Verifications/{verificationId}/Status
   * Audit trail is written server-side; webhook payloads are NOT modified.
   * @param {AdminVerificationStatusOverrideRequest} params
   * @returns {Promise<AdminVerificationStatusOverrideResponse>}
   */
  overrideVerificationStatus: async ({ verificationId, adminId, newStatus, reason } = {}) => {
    try {
      if (!verificationId) {
        return { success: false, error: 'Verification ID is required' };
      }
      if (!adminId) {
        return { success: false, error: 'Admin ID is required' };
      }
      if (!newStatus || !ALLOWED_OVERRIDE_STATUSES.some(s => s.toLowerCase() === String(newStatus).toLowerCase())) {
        return {
          success: false,
          error: `newStatus must be one of: ${ALLOWED_OVERRIDE_STATUSES.join(', ')}`
        };
      }
      if (!reason || reason.trim().length < 5) {
        return { success: false, error: 'Reason is required and must be at least 5 characters' };
      }

      const requestBody = {
        adminId,
        newStatus,
        reason: reason.trim()
      };

      const response = await api.put(
        `/Admin/Verifications/${encodeURIComponent(verificationId)}/Status`,
        requestBody
      );

      const data = response.data || {};
      if (data.success || data.Success) {
        return {
          success: true,
          verificationId: data.verificationId ?? data.VerificationId,
          previousStatus: data.previousStatus ?? data.PreviousStatus,
          newStatus: data.newStatus ?? data.NewStatus,
          isVerified: data.isVerified ?? data.IsVerified,
          message: data.message ?? data.Message
        };
      }

      return {
        success: false,
        error: data.error || data.Error || data.message || data.Message || 'Failed to override verification status'
      };
    } catch (error) {
      console.error('Error overriding verification status:', error);
      return {
        success: false,
        error: error.response?.data?.error
          || error.response?.data?.Error
          || error.response?.data?.message
          || error.response?.data?.Message
          || error.message
          || 'Failed to override verification status'
      };
    }
  },

  /**
   * Admin: edit a caregiver's legal name (e.g. when Dojah returned the middle
   * name in the first-name slot). Updates Caregiver.{First,Middle,Last}Name
   * and the linked AppUser.{First,Last}Name (AppUser has no MiddleName).
   * The original Verification record and webhook payloads are NOT modified.
   * Backend route: PUT /api/Admin/Caregivers/{caregiverId}/Name
   * @param {AdminUpdateCaregiverNameRequest} params
   * @returns {Promise<AdminUpdateCaregiverNameResponse>}
   */
  updateCaregiverName: async ({ caregiverId, adminId, firstName, middleName, lastName, confirmed, reason } = {}) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }
      if (!isObjectId(caregiverId)) {
        // Older Verification.UserId may be an email; the name endpoint requires
        // the caregiver's ObjectId. Caller should resolve via email first.
        return {
          success: false,
          error: 'Caregiver ID is not a valid ObjectId. Resolve the caregiver by email before editing the name.'
        };
      }
      if (!adminId) {
        return { success: false, error: 'Admin ID is required' };
      }
      if (!firstName || !firstName.trim()) {
        return { success: false, error: 'First name is required' };
      }
      if (!lastName || !lastName.trim()) {
        return { success: false, error: 'Last name is required' };
      }
      if (confirmed !== true) {
        return { success: false, error: 'You must explicitly confirm this change' };
      }
      if (!reason || reason.trim().length < 5) {
        return { success: false, error: 'Reason is required and must be at least 5 characters' };
      }

      const requestBody = {
        adminId,
        firstName: firstName.trim(),
        middleName: middleName && middleName.trim() ? middleName.trim() : null,
        lastName: lastName.trim(),
        confirmed: true,
        reason: reason.trim()
      };

      const response = await api.put(
        `/Admin/Caregivers/${encodeURIComponent(caregiverId)}/Name`,
        requestBody
      );

      const data = response.data || {};
      if (data.success || data.Success) {
        return {
          success: true,
          caregiverId: data.caregiverId ?? data.CaregiverId,
          previousFirstName: data.previousFirstName ?? data.PreviousFirstName,
          previousMiddleName: data.previousMiddleName ?? data.PreviousMiddleName,
          previousLastName: data.previousLastName ?? data.PreviousLastName,
          newFirstName: data.newFirstName ?? data.NewFirstName,
          newMiddleName: data.newMiddleName ?? data.NewMiddleName,
          newLastName: data.newLastName ?? data.NewLastName,
          appUserUpdated: data.appUserUpdated ?? data.AppUserUpdated,
          message: data.message ?? data.Message
        };
      }

      return {
        success: false,
        error: data.error || data.Error || data.message || data.Message || 'Failed to edit caregiver name'
      };
    } catch (error) {
      console.error('Error editing caregiver name:', error);
      return {
        success: false,
        error: error.response?.data?.error
          || error.response?.data?.Error
          || error.response?.data?.message
          || error.response?.data?.Message
          || error.message
          || 'Failed to edit caregiver name'
      };
    }
  }
};

export default adminVerificationService;
