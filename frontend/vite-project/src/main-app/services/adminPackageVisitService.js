/**
 * Admin review of package-assignment visits and their GPS check-in flags.
 * GET  /api/admin/package-visits           (flagged=hard|soft|any, unclearedOnly, from, to, caregiverId)
 * POST /api/admin/package-visits/{id}/clear-flag   { note }
 */
import api from './api';

const BASE = '/admin/package-visits';
const extractError = (error, fallback) => error.response?.data?.message || error.message || fallback;

const AdminPackageVisitService = {
  async list(filters = {}) {
    try {
      const params = {};
      if (filters.flagged && filters.flagged !== 'all') params.flagged = filters.flagged;
      if (filters.unclearedOnly) params.unclearedOnly = true;
      if (filters.from) params.from = new Date(filters.from).toISOString();
      if (filters.to) params.to = new Date(`${filters.to}T23:59:59`).toISOString();
      if (filters.caregiverId) params.caregiverId = filters.caregiverId;
      const response = await api.get(BASE, { params });
      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load visits') };
    }
  },

  async clearFlag(checkinId, note) {
    try {
      const response = await api.post(`${BASE}/${checkinId}/clear-flag`, { note });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to clear the flag') };
    }
  },
};

export default AdminPackageVisitService;
