/**
 * Admin Payroll Service
 * Payroll creation + approval workflow via the admin-only endpoints
 * (api/admin/Payroll, gated by OperationsPolicy on the backend).
 */
import api from './api';

const BASE = '/admin/Payroll';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const AdminPayrollService = {
  /**
   * Staff-facing picker: every Accepted assignment (actually in service).
   * Endpoint: GET /api/admin/assignments/accepted
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getAcceptedAssignments() {
    try {
      const response = await api.get('/admin/assignments/accepted');
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching accepted assignments:', error);
      return { success: false, error: extractError(error, 'Failed to fetch accepted assignments') };
    }
  },

  /**
   * Get all payroll records, optionally filtered by caregiver.
   * Endpoint: GET /api/admin/Payroll?caregiverId=
   * @param {string} [caregiverId]
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getAllPayrolls(caregiverId) {
    try {
      const response = await api.get(BASE, { params: caregiverId ? { caregiverId } : {} });
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      return { success: false, error: extractError(error, 'Failed to fetch payroll records') };
    }
  },

  /**
   * Create a Draft payroll record for an assignment's pay-period month.
   * The amount is calculated server-side — never supplied here.
   * Endpoint: POST /api/admin/Payroll
   * @param {Object} payload
   * @param {string} payload.assignmentId
   * @param {number} payload.year
   * @param {number} payload.month
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  async createPayroll(payload) {
    try {
      const response = await api.post(BASE, {
        AssignmentId: payload.assignmentId,
        Year: payload.year,
        Month: payload.month,
      });
      const body = response.data || {};
      return { success: true, data: body.data, message: body.message || 'Payroll record created successfully' };
    } catch (error) {
      console.error('Error creating payroll record:', error);
      return { success: false, error: extractError(error, 'Failed to create payroll record') };
    }
  },

  /**
   * Approve a Draft payroll record, crediting the caregiver's wallet.
   * Omit finalAmount to approve at CalculatedAmount; supply it with overrideReason to override.
   * Endpoint: POST /api/admin/Payroll/{id}/approve
   * @param {string} id
   * @param {Object} [overrides]
   * @param {number} [overrides.finalAmount]
   * @param {string} [overrides.overrideReason] - required (min 5 chars) if finalAmount differs from calculated
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  async approvePayroll(id, overrides = {}) {
    try {
      const body = {};
      if (overrides.finalAmount !== undefined && overrides.finalAmount !== null && overrides.finalAmount !== '') {
        body.FinalAmount = Number(overrides.finalAmount);
      }
      if (overrides.overrideReason) body.OverrideReason = overrides.overrideReason;
      const response = await api.post(`${BASE}/${id}/approve`, body);
      const payload = response.data || {};
      return { success: true, data: payload.data, message: payload.message || 'Payroll record approved and wallet credited' };
    } catch (error) {
      console.error('Error approving payroll record:', error);
      return { success: false, error: extractError(error, 'Failed to approve payroll record') };
    }
  },

  /**
   * Mark an Approved payroll record Paid — reconciliation status only, no wallet movement.
   * Endpoint: POST /api/admin/Payroll/{id}/mark-paid
   * @param {string} id
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async markPaid(id) {
    try {
      const response = await api.post(`${BASE}/${id}/mark-paid`);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Payroll record marked as paid' };
    } catch (error) {
      console.error('Error marking payroll record paid:', error);
      return { success: false, error: extractError(error, 'Failed to mark payroll record as paid') };
    }
  },

  /**
   * Delete a Draft payroll record. Approved/Paid records cannot be deleted.
   * Endpoint: DELETE /api/admin/Payroll/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async deletePayroll(id) {
    try {
      const response = await api.delete(`${BASE}/${id}`);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Payroll record deleted successfully' };
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      return { success: false, error: extractError(error, 'Failed to delete payroll record') };
    }
  },
};

export default AdminPayrollService;
