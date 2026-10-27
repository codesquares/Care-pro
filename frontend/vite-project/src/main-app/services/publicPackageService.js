/**
 * Public Package Service
 * Fetches the anonymous, price-free package summaries (category / tier / description /
 * caregiver type only) for the public homepage. No authentication required; pricing lives
 * behind the authenticated /client/packages endpoint (clientPackageService).
 */
import api from './api';
import config from '../config';

const BASE_API_URL = config.BASE_URL;

const PublicPackageService = {
  /**
   * @returns {Promise<{success: boolean, data: Array<{category: string, tierLabel: string, description: string, requiredCaregiverType: string}>}>}
   */
  async getPackageSummaries() {
    try {
      const response = await api.get(`${BASE_API_URL}/public/packages`);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: payload.success !== false, data };
    } catch (error) {
      console.error('Error fetching public package summaries:', error);
      return { success: false, data: [] };
    }
  },
};

export default PublicPackageService;
