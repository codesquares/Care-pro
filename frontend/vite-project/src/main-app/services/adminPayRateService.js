/**
 * Admin Caregiver Pay Rate Service
 * CRUD for the payroll rate table — (CaregiverType, ExperienceTier) -> HourlyRate
 * via the admin-only endpoints (api/admin/CaregiverPayRates, gated by OperationsPolicy).
 */
import api from './api';

const BASE = '/admin/CaregiverPayRates';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const AdminPayRateService = {
  /**
   * Get all pay rates (active and inactive).
   * Endpoint: GET /api/admin/CaregiverPayRates
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getAllPayRates() {
    try {
      const response = await api.get(BASE);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching pay rates:', error);
      return { success: false, error: extractError(error, 'Failed to fetch pay rates') };
    }
  },

  /**
   * Create a new pay rate.
   * Endpoint: POST /api/admin/CaregiverPayRates
   * @param {Object} rate
   * @param {string} rate.caregiverType - "AuxiliaryNurse" | "CHEW" | "RegisteredNurse"
   * @param {string} rate.experienceTier - "Junior" | "Mid" | "Senior"
   * @param {number} rate.hourlyRate
   * @param {boolean} [rate.isActive]
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  async createPayRate(rate) {
    try {
      const response = await api.post(BASE, rate);
      const payload = response.data || {};
      return { success: true, data: payload.data, message: payload.message || 'Pay rate created successfully' };
    } catch (error) {
      console.error('Error creating pay rate:', error);
      return { success: false, error: extractError(error, 'Failed to create pay rate') };
    }
  },

  /**
   * Update a pay rate. Only fields supplied are changed (partial update).
   * Endpoint: PUT /api/admin/CaregiverPayRates/{id}
   * @param {string} id
   * @param {Object} updates - Same shape as createPayRate's rate, all fields optional
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async updatePayRate(id, updates) {
    try {
      const response = await api.put(`${BASE}/${id}`, updates);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Pay rate updated successfully' };
    } catch (error) {
      console.error('Error updating pay rate:', error);
      return { success: false, error: extractError(error, 'Failed to update pay rate') };
    }
  },

  /**
   * Delete a pay rate.
   * Endpoint: DELETE /api/admin/CaregiverPayRates/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async deletePayRate(id) {
    try {
      const response = await api.delete(`${BASE}/${id}`);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Pay rate deleted successfully' };
    } catch (error) {
      console.error('Error deleting pay rate:', error);
      return { success: false, error: extractError(error, 'Failed to delete pay rate') };
    }
  },

  /**
   * Toggle a pay rate's active status (activate/deactivate).
   * Endpoint: PATCH /api/admin/CaregiverPayRates/{id}/toggle-status
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async toggleActiveStatus(id, isActive) {
    try {
      const response = await api.patch(`${BASE}/${id}/toggle-status`, { isActive });
      const payload = response.data || {};
      return { success: true, message: payload.message || `Pay rate ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
      console.error('Error toggling pay rate status:', error);
      return { success: false, error: extractError(error, 'Failed to toggle pay rate status') };
    }
  },
};

export default AdminPayRateService;
