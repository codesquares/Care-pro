/**
 * Client Package Service
 * Fetches the care-package catalog for authenticated clients.
 */
import api from './api';
import config from '../config';

const BASE_API_URL = config.BASE_URL;

const ClientPackageService = {
  /**
   * Get the full care-package catalog.
   * Requires an authenticated request — the backend returns 401 without one.
   * @returns {Promise<{success: boolean, data: Array, count: number, error?: unknown}>}
   */
  async getPackages() {
    try {
      const response = await api.get(`${BASE_API_URL}/client/packages`);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return {
        success: payload.success !== false,
        data,
        count: typeof payload.count === 'number' ? payload.count : data.length,
      };
    } catch (error) {
      console.error('Error fetching client packages:', error);
      return { success: false, data: [], count: 0, error };
    }
  },
};

export default ClientPackageService;
