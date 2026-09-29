/**
 * Caregiver Assignment Service.
 * Read-only views of a caregiver's package-model assignments: the enriched
 * list/detail, the generated contract (once one exists), and this
 * assignment's TaskSheet visit history.
 */
import api from './api';
import config from '../config';
import { extractApiErrorMessage } from '../utils/uiErrorMapper';

const BASE = '/caregiver/assignments';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const CaregiverAssignmentService = {
  /**
   * Endpoint: GET /api/caregiver/assignments
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getMyAssignments() {
    try {
      const response = await api.get(BASE);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return { success: false, error: extractError(error, 'Failed to load your assignments') };
    }
  },

  /**
   * Endpoint: GET /api/caregiver/assignments/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string, status?: number}>}
   */
  async getAssignmentById(id) {
    try {
      const response = await api.get(`${BASE}/${id}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error('Error fetching assignment:', error);
      return {
        success: false,
        error: extractError(error, 'Failed to load this assignment'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Endpoint: GET /api/caregiver/assignments/{id}/contract
   * 404 until the assignment is Accepted and the contract has been auto-generated.
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string, status?: number}>}
   */
  async getContract(id) {
    try {
      const response = await api.get(`${BASE}/${id}/contract`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return {
        success: false,
        error: extractError(error, 'Contract not available yet'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Endpoint: GET /api/caregiver/assignments/{id}/contract/pdf
   * Downloads the PDF directly (not JSON), same approach as the client-side download.
   * @param {string} id
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async downloadContractPdf(id) {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${config.BASE_URL}${BASE}/${id}/contract/pdf`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error(`Failed to download PDF (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CarePro-Agreement-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error downloading contract PDF:', error);
      return { success: false, error: error.message || 'Failed to download contract PDF' };
    }
  },

  /**
   * Endpoint: GET /api/caregiver/assignments/{id}/visits
   * TaskSheet history for this assignment — today's-and-past visits only,
   * not a forward-looking schedule (there's no advance-scheduling mechanism yet).
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getVisits(id) {
    try {
      const response = await api.get(`${BASE}/${id}/visits`);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching visit history:', error);
      return { success: false, error: extractError(error, 'Failed to load visit history') };
    }
  },

  /**
   * Endpoint: POST /api/caregiver/assignments/{id}/accept
   * Idempotent server-side — accepting an already-Accepted assignment returns
   * success with the same status rather than an error, so a double-click/double
   * submit is safe. 409 if the assignment is no longer PendingAcceptance
   * (already responded, or cancelled by staff); 403 if it isn't this caregiver's.
   * Uses the shared error mapper (uiErrorMapper) rather than the plain
   * message-only extractError above, so field-level validation reasons surface.
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: {success, assignmentId, status, message}, error?: string, status?: number}>}
   */
  async acceptAssignment(id) {
    try {
      const response = await api.post(`${BASE}/${id}/accept`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error accepting assignment:', error);
      return {
        success: false,
        error: extractApiErrorMessage(error, 'Failed to accept this assignment'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Endpoint: POST /api/caregiver/assignments/{id}/decline
   * Reason is optional server-side (max 500 chars, not required) — the UI
   * should match that, not force one. 409 if the assignment is no longer
   * PendingAcceptance; 403 if it isn't this caregiver's.
   * @param {string} id
   * @param {string} [reason]
   * @returns {Promise<{success: boolean, data?: {success, assignmentId, status, message}, error?: string, status?: number}>}
   */
  async declineAssignment(id, reason) {
    try {
      const response = await api.post(`${BASE}/${id}/decline`, { reason: reason?.trim() || null });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error declining assignment:', error);
      return {
        success: false,
        error: extractApiErrorMessage(error, 'Failed to decline this assignment'),
        status: error.response?.status,
      };
    }
  },
};

export default CaregiverAssignmentService;
