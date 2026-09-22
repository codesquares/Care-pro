/**
 * Client Package Request Service (Tier E, read-only).
 * A client never creates a PackageRequest through a UI action — payment does,
 * via the Phase 5 WhatsApp webhook (not built yet). This service only reads
 * requests that already exist, plus the contract once one is confirmed.
 */
import api from './api';
import config from '../config';

const BASE = '/client/package-requests';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const ClientPackageRequestService = {
  /**
   * Endpoint: GET /api/client/package-requests
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getMyRequests() {
    try {
      const response = await api.get(BASE);
      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching package requests:', error);
      return { success: false, error: extractError(error, 'Failed to load your requests') };
    }
  },

  /**
   * Endpoint: GET /api/client/package-requests/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string, status?: number}>}
   */
  async getRequestById(id) {
    try {
      const response = await api.get(`${BASE}/${id}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error('Error fetching package request:', error);
      return {
        success: false,
        error: extractError(error, 'Failed to load this request'),
        status: error.response?.status,
      };
    }
  },

  /**
   * Endpoint: GET /api/client/package-requests/{id}/contract
   * 404 until the request is confirmed and the contract has been auto-generated.
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
   * Endpoint: GET /api/client/package-requests/{id}/contract/pdf
   * Downloads the PDF directly (not JSON), so this bypasses the axios instance
   * the same way ContractDetailPage.jsx's legacy download does.
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
};

export default ClientPackageRequestService;
