import api from './api';

/**
 * Chat Violations / Compliance Service
 * Base route: /api/admin/chat-violations
 * Auth: SuperAdmin, Admin
 */
const chatViolationsService = {
  /**
   * Get paginated list of chat violations
   * Endpoint: GET /api/admin/chat-violations?skip=&take=&userId=&violationType=
   * @param {Object} params
   * @param {number} [params.skip=0]
   * @param {number} [params.take=20]
   * @param {string} [params.userId]
   * @param {string} [params.violationType]
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getViolations: async (params = {}) => {
    try {
      const query = {};
      if (params.skip  !== undefined) query.skip  = params.skip;
      if (params.take  !== undefined) query.take  = params.take;
      if (params.userId)              query.userId = params.userId;
      if (params.violationType)       query.violationType = params.violationType;

      const response = await api.get('/admin/chat-violations', { params: query });
      const payload  = response.data;
      return {
        success: true,
        data: Array.isArray(payload) ? payload : (payload.data || payload || []),
      };
    } catch (error) {
      console.error('Error fetching chat violations:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch chat violations',
      };
    }
  },

  /**
   * Get users with repeated violations
   * Endpoint: GET /api/admin/chat-violations/repeat-offenders?minViolations=3&days=30
   * @param {number} [minViolations=3]
   * @param {number} [days=30]
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getRepeatOffenders: async (minViolations = 3, days = 30) => {
    try {
      const response = await api.get('/admin/chat-violations/repeat-offenders', {
        params: { minViolations, days },
      });
      const payload = response.data;
      return {
        success: true,
        data: Array.isArray(payload) ? payload : (payload.data || payload || []),
      };
    } catch (error) {
      console.error('Error fetching repeat offenders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch repeat offenders',
      };
    }
  },

  /**
   * Get a single violation record
   * Endpoint: GET /api/admin/chat-violations/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getViolationDetail: async (id) => {
    try {
      const response = await api.get(`/admin/chat-violations/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching violation detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch violation detail',
      };
    }
  },
};

export default chatViolationsService;
