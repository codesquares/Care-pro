/**
 * Admin Guarantor Service
 * Staff-facing guarantor visibility + manual override for caregiver vetting
 * (api/Admin/Caregivers/Vetting, gated by OperationsPolicy on the backend).
 *
 * Note: unlike most admin endpoints, these return the raw GuarantorResponse
 * object/array directly (not wrapped in a {success, data} envelope) — this
 * service normalises that into the same {success, data, error} shape used
 * everywhere else in the app.
 */
import api from './api';

const BASE = '/Admin/Caregivers/Vetting';

const extractError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const AdminGuarantorService = {
  /**
   * Get every guarantor a caregiver has nominated.
   * Endpoint: GET /api/Admin/Caregivers/Vetting/caregivers/{caregiverId}/guarantors
   * @param {string} caregiverId
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getGuarantors(caregiverId) {
    try {
      const response = await api.get(`${BASE}/caregivers/${caregiverId}/guarantors`);
      const data = Array.isArray(response.data) ? response.data : [];
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching guarantors:', error);
      return { success: false, error: extractError(error, 'Failed to fetch guarantors') };
    }
  },

  /**
   * Manually confirm a guarantor (email bounced / verified by phone / etc.), bypassing
   * the self-serve link. Requires a reason (min 5 chars, enforced server-side too).
   * Idempotent — a safe no-op if the guarantor is already confirmed (self-serve or a
   * prior override): the original confirmation and attribution are left untouched.
   * Endpoint: PUT /api/Admin/Caregivers/Vetting/guarantors/{guarantorId}/confirm
   * @param {string} guarantorId
   * @param {string} reason
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async confirmGuarantor(guarantorId, reason) {
    try {
      const response = await api.put(`${BASE}/guarantors/${guarantorId}/confirm`, { Reason: reason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error confirming guarantor:', error);
      return { success: false, error: extractError(error, 'Failed to confirm guarantor') };
    }
  },

  /**
   * Resend a guarantor's confirmation link on the caregiver's behalf. Bypasses the
   * resend cooldown; still subject to the lifetime attempt cap. No reason required —
   * lower-stakes than a manual override.
   * Endpoint: POST /api/Admin/Caregivers/Vetting/guarantors/{guarantorId}/resend-confirmation
   * @param {string} guarantorId
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async resendConfirmation(guarantorId) {
    try {
      const response = await api.post(`${BASE}/guarantors/${guarantorId}/resend-confirmation`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error resending guarantor confirmation link:', error);
      return { success: false, error: extractError(error, 'Failed to resend confirmation link') };
    }
  },
};

export default AdminGuarantorService;
