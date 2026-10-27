/**
 * Admin Package Service
 * CRUD for pre-priced care packages via the admin-only endpoints
 * (api/admin/Packages, gated by OperationsPolicy on the backend).
 */
import api from './api';

const BASE = '/admin/Packages';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const AdminPackageService = {
  /**
   * Get all care packages (active and inactive).
   * Endpoint: GET /api/admin/Packages
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  async getAllPackages() {
    try {
      const response = await api.get(BASE);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data, count: payload.count ?? data.length };
    } catch (error) {
      console.error('Error fetching packages:', error);
      return { success: false, error: extractError(error, 'Failed to fetch packages') };
    }
  },

  /**
   * Get a single package by ID.
   * Endpoint: GET /api/admin/Packages/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getPackageById(id) {
    try {
      const response = await api.get(`${BASE}/${id}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error('Error fetching package:', error);
      return { success: false, error: extractError(error, 'Failed to fetch package') };
    }
  },

  /**
   * Create a new care package.
   * Endpoint: POST /api/admin/Packages
   * @param {Object} pkg
   * @param {string} pkg.category - One of the 4 fixed PackageCategories values
   * @param {string} pkg.tierLabel
   * @param {string} pkg.requiredCaregiverType - "AuxiliaryNurse" | "CHEW" | "RegisteredNurse"
   * @param {string} [pkg.requiredSpecialty]
   * @param {number} pkg.basePrice
   * @param {number} [pkg.additionalDayPrice]
   * @param {string} pkg.payCalculationType - "Hourly" | "Fixed"
   * @param {number} [pkg.fixedCaregiverPay] - Required (and only allowed) when payCalculationType is "Fixed"
   * @param {string} [pkg.description]
   * @param {boolean} [pkg.isActive]
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
   */
  async createPackage(pkg) {
    try {
      const response = await api.post(BASE, pkg);
      const payload = response.data || {};
      return { success: true, data: payload.data, message: payload.message || 'Package created successfully' };
    } catch (error) {
      console.error('Error creating package:', error);
      return { success: false, error: extractError(error, 'Failed to create package') };
    }
  },

  /**
   * Update a care package. Only fields supplied are changed (partial update).
   * Endpoint: PUT /api/admin/Packages/{id}
   * @param {string} id
   * @param {Object} updates - Same shape as createPackage's pkg, all fields optional
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async updatePackage(id, updates) {
    try {
      const response = await api.put(`${BASE}/${id}`, updates);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Package updated successfully' };
    } catch (error) {
      console.error('Error updating package:', error);
      return { success: false, error: extractError(error, 'Failed to update package') };
    }
  },

  /**
   * Delete a care package.
   * Endpoint: DELETE /api/admin/Packages/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async deletePackage(id) {
    try {
      const response = await api.delete(`${BASE}/${id}`);
      const payload = response.data || {};
      return { success: true, message: payload.message || 'Package deleted successfully' };
    } catch (error) {
      console.error('Error deleting package:', error);
      return { success: false, error: extractError(error, 'Failed to delete package') };
    }
  },

  /**
   * Toggle a package's active status (activate/deactivate).
   * Endpoint: PATCH /api/admin/Packages/{id}/toggle-status
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async toggleActiveStatus(id, isActive) {
    try {
      const response = await api.patch(`${BASE}/${id}/toggle-status`, { isActive });
      const payload = response.data || {};
      return { success: true, message: payload.message || `Package ${isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
      console.error('Error toggling package status:', error);
      return { success: false, error: extractError(error, 'Failed to toggle package status') };
    }
  },
};

export default AdminPackageService;
