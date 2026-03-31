/**
 * Refund Request Service
 * Handles client refund requests and admin review workflows.
 *
 * Endpoints consumed:
 *   POST   /api/RefundRequests              — Client submits refund request
 *   GET    /api/RefundRequests/my-requests   — Client views own requests
 *   GET    /api/RefundRequests/{requestId}   — Client/Admin views single request
 *   GET    /api/RefundRequests/all           — Admin lists all requests (optional ?status=)
 *   PUT    /api/RefundRequests/{id}/review   — Admin approves/rejects
 *   PUT    /api/RefundRequests/{id}/complete — Admin marks bank transfer done
 */
import api from './api';

/** Refund request status constants */
export const REFUND_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const RefundRequestService = {
  // ── Client endpoints ──────────────────────────────────────

  /**
   * Submit a new refund request.
   * Only ONE pending request allowed at a time.
   * @param {{ amount: number, reason: string }} payload
   */
  async submitRequest({ amount, reason }) {
    try {
      const response = await api.post('/RefundRequests', { amount, reason });
      return { success: true, data: response.data };
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message = Array.isArray(errors) ? errors[0] : error.response?.data?.message || error.message;
      return { success: false, error: message };
    }
  },

  /**
   * Get all refund requests for the current client (newest first).
   */
  async getMyRequests() {
    try {
      const response = await api.get('/RefundRequests/my-requests');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get a single refund request by ID (client sees own, admin sees any).
   * @param {string} requestId
   */
  async getRequest(requestId) {
    try {
      const response = await api.get(`/RefundRequests/${encodeURIComponent(requestId)}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message,
      };
    }
  },

  // ── Admin endpoints ───────────────────────────────────────

  /**
   * Get all refund requests (admin only). Optionally filter by status.
   * @param {string} [status] — 'Pending' | 'Approved' | 'Rejected' | 'Completed'
   */
  async getAllRequests(status) {
    try {
      const url = status
        ? `/RefundRequests/all?status=${encodeURIComponent(status)}`
        : '/RefundRequests/all';
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Admin reviews (approves or rejects) a refund request.
   * On approval the client wallet is debited.
   * @param {string} requestId
   * @param {{ status: 'Approved'|'Rejected', adminNote?: string }} payload
   */
  async reviewRequest(requestId, { status, adminNote }) {
    try {
      const response = await api.put(
        `/RefundRequests/${encodeURIComponent(requestId)}/review`,
        { status, adminNote },
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message = Array.isArray(errors) ? errors[0] : error.response?.data?.message || error.message;
      return { success: false, error: message };
    }
  },

  /**
   * Admin marks an approved refund as completed (bank transfer done).
   * @param {string} requestId
   */
  async completeRequest(requestId) {
    try {
      const response = await api.put(
        `/RefundRequests/${encodeURIComponent(requestId)}/complete`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errors = error.response?.data?.errors;
      const message = Array.isArray(errors) ? errors[0] : error.response?.data?.message || error.message;
      return { success: false, error: message };
    }
  },

  // ── Helpers ───────────────────────────────────────────────

  /**
   * Get display colour for a refund status badge.
   */
  getStatusColor(status) {
    switch (status) {
      case REFUND_STATUS.PENDING:   return '#f59e0b';
      case REFUND_STATUS.APPROVED:  return '#3b82f6';
      case REFUND_STATUS.REJECTED:  return '#ef4444';
      case REFUND_STATUS.COMPLETED: return '#22c55e';
      default: return '#6b7280';
    }
  },
};

export default RefundRequestService;
