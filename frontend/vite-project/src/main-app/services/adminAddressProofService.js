/**
 * Admin review of caregivers' address bills (power-holding / NEPA utility bill for the CURRENT address).
 * Operations/Policy admins only — every other department gets 403. The route id is the address-history record id.
 * GET  /api/admin/address-proofs?status=&search=&page=&pageSize=   (oldest first)
 * GET  /api/admin/address-proofs/pending-count
 * GET  /api/admin/address-proofs/{id}
 * POST /api/admin/address-proofs/{id}/approve  { checklist:{...4 booleans}, notes }
 * POST /api/admin/address-proofs/{id}/reject   { reason }
 * GET  /api/admin/address-proofs/{id}/file     (Blob; every view is audit-logged server-side)
 * The reviewer is always taken from the token — no admin id is ever sent.
 */
import api from './api';

const BASE = '/admin/address-proofs';
const extractError = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const ADDRESS_CHECKLIST_ITEMS = [
  { key: 'nameMatchesProfile', label: 'The name on the bill matches the caregiver’s profile name' },
  { key: 'addressMatchesEntry', label: 'The address on the bill matches the address the caregiver entered' },
  { key: 'billWithinAllowedAge', label: 'The bill date is present and within the allowed age' },
  { key: 'scanLegibleAndUnaltered', label: 'The scan is legible and has not been altered' },
];

const adminAddressProofService = {
  async list({ status, search, page = 1, pageSize = 50 } = {}) {
    try {
      const params = { page, pageSize };
      if (status && status !== 'all') params.status = status;
      if (search && search.trim()) params.search = search.trim();
      const response = await api.get(BASE, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load address bills') };
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
      return { success: false, error: extractError(error, 'Failed to load this bill') };
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

  async fetchFile(id) {
    try {
      const response = await api.get(`${BASE}/${id}/file`, { responseType: 'blob', timeout: 60000 });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Could not open this file') };
    }
  },
};

export default adminAddressProofService;
