/**
 * Staff workflow for caregiver "can't attend" notices (Operations/Policy admins only — every other department gets 403).
 * GET  /api/admin/visit-absence-notices?status=&shortNotice=   (open first, then short-notice first, then soonest day)
 * GET  /api/admin/visit-absence-notices/{id}                   (adds the audit history)
 * POST /api/admin/visit-absence-notices/{id}/status  { status, note }
 * The acting admin is always taken from the token — no admin id is ever sent. Status changes are RECORDS: they move
 * no money and touch no payroll, task sheet or assignment.
 */
import api from './api';

const BASE = '/admin/visit-absence-notices';
const extractError = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const STATUSES = ['open', 'cover_arranged', 'credited', 'no_action_needed', 'closed', 'withdrawn'];
export const STATUS_LABELS = {
  open: 'Open',
  cover_arranged: 'Cover arranged',
  credited: 'Credited',
  no_action_needed: 'No action needed',
  closed: 'Closed',
  withdrawn: 'Withdrawn',
};

const adminAbsenceNoticeService = {
  async list({ status, shortNotice } = {}) {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (shortNotice) params.shortNotice = true;
      const response = await api.get(BASE, { params });
      const payload = response.data || {};
      return { success: true, data: Array.isArray(payload.data) ? payload.data : [] };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load absence notices'), status: error?.response?.status };
    }
  },

  async detail(id) {
    try {
      const response = await api.get(`${BASE}/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to load the notice') };
    }
  },

  async setStatus(id, status, note) {
    try {
      const response = await api.post(`${BASE}/${id}/status`, { status, note });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Failed to update the notice'), status: error?.response?.status };
    }
  },
};

export default adminAbsenceNoticeService;
