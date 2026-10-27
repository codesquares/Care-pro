/**
 * Admin review of police clearances (Operations/Policy admins only — every other department gets 403).
 * GET  /api/admin/police-clearances?status=&search=&page=&pageSize=   (latest submission per caregiver, oldest first)
 * GET  /api/admin/police-clearances/pending-count
 * GET  /api/admin/police-clearances/{id}
 * POST /api/admin/police-clearances/{id}/approve  { checklist:{...5 booleans}, notes }
 * POST /api/admin/police-clearances/{id}/reject   { reason }
 * POST /api/admin/police-clearances/{id}/revoke   { reason }
 * GET  /api/admin/police-clearances/{id}/files/{index}   (Blob; every view is audit-logged server-side)
 * The reviewer is always taken from the token — no admin id is ever sent.
 */
import api from './api';

const BASE = '/admin/police-clearances';
const extractError = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const CHECKLIST_ITEMS = [
  { key: 'nameMatchesProfile', label: 'The name matches the caregiver’s profile name' },
  { key: 'issuedByNigeriaPoliceForce', label: 'It was issued by the Nigeria Police Force' },
  { key: 'issueDateWithinAllowedAge', label: 'The issue date is present and within the allowed age' },
  { key: 'referenceNumberCaptured', label: 'The reference number is captured (matches the document)' },
  { key: 'scanLegibleAndUnaltered', label: 'The scan is legible and has not been altered' },
];

const adminPoliceClearanceService = {
  async list({ status, search, page = 1, pageSize = 50 } = {}) {
    try {
      const params = { page, pageSize };
      if (status && status !== 'all') params.status = status;
      if (search && search.trim()) params.search = search.trim();
      const response = await api.get(BASE, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load police clearances') };
    }
  },

  async pendingCount() {
    try {
      const response = await api.get(`${BASE}/pending-count`);
      return { success: true, data: response.data?.count ?? 0 };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load the pending count') };
    }
  },

  async detail(id) {
    try {
      const response = await api.get(`${BASE}/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load this clearance') };
    }
  },

  async approve(id, checklist, notes) {
    try {
      const response = await api.post(`${BASE}/${id}/approve`, { checklist, notes: notes || null });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to approve') };
    }
  },

  async reject(id, reason) {
    try {
      const response = await api.post(`${BASE}/${id}/reject`, { reason });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to reject') };
    }
  },

  async revoke(id, reason) {
    try {
      const response = await api.post(`${BASE}/${id}/revoke`, { reason });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to revoke') };
    }
  },

  async fetchFile(id, index) {
    try {
      const response = await api.get(`${BASE}/${id}/files/${index}`, { responseType: 'blob', timeout: 60000 });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Could not open this file') };
    }
  },
};

export default adminPoliceClearanceService;
