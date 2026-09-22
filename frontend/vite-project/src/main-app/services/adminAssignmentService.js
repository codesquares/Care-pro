/**
 * Admin Assignment Service
 * Staff-facing internal assignment (Phase 4) via the admin-only endpoints
 * (api/admin/assignments, gated by OperationsPolicy on the backend).
 */
import api from './api';

const BASE = '/admin/assignments';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const AdminAssignmentService = {
  /**
   * Staff-facing package request picker.
   * Endpoint: GET /api/admin/assignments/package-requests?status=
   * @param {string} [status] - 'pending' | 'assigned' | 'confirmed' | 'cancelled' (omit for all)
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getPackageRequests(status) {
    try {
      const response = await api.get(`${BASE}/package-requests`, { params: status ? { status } : {} });
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching package requests:', error);
      return { success: false, error: extractError(error, 'Failed to fetch package requests') };
    }
  },

  /**
   * Ranked caregiver candidates for a package request.
   * Endpoint: GET /api/admin/assignments/candidates?packageRequestId=
   * @param {string} packageRequestId
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getCandidates(packageRequestId) {
    try {
      const response = await api.get(`${BASE}/candidates`, { params: { packageRequestId } });
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return {
        success: false,
        error: extractError(error, 'Failed to fetch candidates'),
        errorCode: error.response?.data?.errorCode,
        reasons: error.response?.data?.reasons,
      };
    }
  },

  /**
   * Assign a caregiver to a package request. Creates the assignment in
   * PendingAcceptance status — the client does not see the caregiver yet.
   * Endpoint: POST /api/admin/assignments
   * @param {Object} payload
   * @param {string} payload.packageRequestId
   * @param {string} payload.caregiverId
   * @param {number} [payload.matchScore]
   * @returns {Promise<{success: boolean, data?: Object, error?: string, reasons?: string[]}>}
   */
  async createAssignment(payload) {
    try {
      const response = await api.post(BASE, {
        PackageRequestId: payload.packageRequestId,
        CaregiverId: payload.caregiverId,
        MatchScore: payload.matchScore,
        AssignedBy: 'staff',
      });
      const body = response.data || {};
      return { success: true, data: body.data };
    } catch (error) {
      console.error('Error creating assignment:', error);
      return {
        success: false,
        error: extractError(error, 'Failed to assign caregiver'),
        errorCode: error.response?.data?.errorCode,
        reasons: error.response?.data?.reasons,
      };
    }
  },

  /**
   * The Pending Acceptance view — assignments awaiting a caregiver response,
   * longest-pending first. There is no automatic timeout/reassignment, so this
   * is the primary way staff notices a stalled assignment.
   * Endpoint: GET /api/admin/assignments/pending-acceptance
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getPendingAcceptance() {
    try {
      const response = await api.get(`${BASE}/pending-acceptance`);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching pending acceptance list:', error);
      return { success: false, error: extractError(error, 'Failed to fetch pending acceptance list') };
    }
  },

  /**
   * Withdraw a stalled assignment so staff can try a different candidate.
   * Only works while the assignment is still PendingAcceptance.
   * Endpoint: POST /api/admin/assignments/{id}/cancel
   * @param {string} id
   * @param {string} reason - min 5 characters
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async cancelAssignment(id, reason) {
    try {
      const response = await api.post(`${BASE}/${id}/cancel`, { Reason: reason });
      const payload = response.data || {};
      return { success: true, message: payload.Message || payload.message || 'Assignment cancelled' };
    } catch (error) {
      console.error('Error cancelling assignment:', error);
      return { success: false, error: extractError(error, 'Failed to cancel assignment') };
    }
  },
};

export default AdminAssignmentService;
