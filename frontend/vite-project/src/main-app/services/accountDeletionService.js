import api from './api';
import config from '../config';

/**
 * Account Deletion Service
 *
 * Self-service (authenticated) endpoints — uses the axios `api` instance so the
 * Bearer token is injected automatically.
 *
 * Token-based (unauthenticated) endpoints — uses plain fetch so no auth header
 * is attached (AllowAnonymous endpoints that validate the signed token instead).
 */
const accountDeletionService = {
  // ── Caregiver self-service ────────────────────────────────────────────────

  /**
   * Request caregiver account deletion.
   * DELETE /api/CareGivers/request-account-deletion
   * @param {string} [reason] — optional reason
   * @returns {Promise<{success, message, permanentDeletionDate}>}
   */
  requestCaregiverDeletion: async (reason = '') => {
    const response = await api.delete('/CareGivers/request-account-deletion', {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Cancel a pending caregiver deletion (requires active session).
   * POST /api/CareGivers/cancel-account-deletion
   * @returns {Promise<{success, message}>}
   */
  cancelCaregiverDeletion: async () => {
    const response = await api.post('/CareGivers/cancel-account-deletion');
    return response.data;
  },

  // ── Client self-service ───────────────────────────────────────────────────

  /**
   * Request client account deletion.
   * DELETE /api/Clients/request-account-deletion
   * @param {string} [reason] — optional reason
   * @returns {Promise<{success, message, permanentDeletionDate}>}
   */
  requestClientDeletion: async (reason = '') => {
    const response = await api.delete('/Clients/request-account-deletion', {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Cancel a pending client deletion (requires active session).
   * POST /api/Clients/cancel-account-deletion
   * @returns {Promise<{success, message}>}
   */
  cancelClientDeletion: async () => {
    const response = await api.post('/Clients/cancel-account-deletion');
    return response.data;
  },

  // ── Token-based (unauthenticated, email link) ─────────────────────────────

  /**
   * Cancel an account deletion using the signed token from the scheduled-deletion
   * email link.  Uses plain fetch — no Bearer token attached.
   * POST /api/CareGivers/cancel-account-deletion-by-token?token=X
   * POST /api/Clients/cancel-account-deletion-by-token?token=X
   *
   * @param {'caregiver'|'client'} role
   * @param {string} token — the signed JWT from the URL query param
   * @returns {Promise<{success, message}>}
   */
  cancelByToken: async (role, token) => {
    const segment = role === 'client' ? 'Clients' : 'CareGivers';
    const url = `${config.BASE_URL}/${segment}/cancel-account-deletion-by-token?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) {
      // Preserve HTTP status for the caller to act on
      const err = new Error(data?.message || 'Request failed');
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  },
};

export default accountDeletionService;
