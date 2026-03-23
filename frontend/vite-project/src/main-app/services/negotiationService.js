/**
 * Negotiation Service
 * Handles all pre-contract negotiation operations.
 *
 * Flow:
 *  1. Either party creates a negotiation  → POST /negotiations
 *  2. Both parties update proposals iteratively
 *  3. Each party signals agreement        → PUT /client-agree | /caregiver-agree
 *  4. When BothAgreed → convert           → POST /convert-to-contract
 *     (contract is created with status Approved — no further approval needed)
 */
import config from '../config';

const NegotiationService = {
  // ─────────────────────────────────────────────
  // Internal helper — shared fetch wrapper
  // ─────────────────────────────────────────────
  async _request(method, path, body = null) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return { success: false, error: 'Authentication required' };

      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      if (body !== null) opts.body = JSON.stringify(body);

      const response = await fetch(`${config.BASE_URL}${path}`, opts);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `Request failed (${response.status})`,
          statusCode: response.status,
        };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  // ─────────────────────────────────────────────
  // Create a new negotiation session
  // ─────────────────────────────────────────────
  /**
   * @param {Object} payload
   * @param {string} payload.orderId
   * @param {string[]} payload.proposedTasks
   * @param {Array<{dayOfWeek,startTime,endTime}>} payload.proposedSchedule
   * @param {string} [payload.serviceAddress]
   * @param {string} [payload.accessInstructions]
   * @param {string} [payload.specialRequirements]
   * @param {string} [payload.additionalNotes]
   * @param {string} [payload.note]
   */
  async startNegotiation(payload) {
    return this._request('POST', '/negotiations', payload);
  },

  // ─────────────────────────────────────────────
  // Fetch
  // ─────────────────────────────────────────────
  /** Returns active (non-abandoned, non-converted) negotiation for order, or 404 */
  async getByOrderId(orderId) {
    const result = await this._request('GET', `/negotiations/by-order/${orderId}`);
    // Treat 404 as "no active negotiation" rather than an error
    if (!result.success && result.statusCode === 404) {
      return { success: true, data: null, hasNegotiation: false };
    }
    if (result.success) {
      return { success: true, data: result.data, hasNegotiation: true };
    }
    return result;
  },

  async getById(id) {
    return this._request('GET', `/negotiations/${id}`);
  },

  // ─────────────────────────────────────────────
  // Client actions
  // ─────────────────────────────────────────────
  /**
   * @param {string} id
   * @param {Object} payload
   * @param {string[]} [payload.proposedTasks]
   * @param {Array}    [payload.proposedSchedule]
   * @param {string}   [payload.serviceAddress]
   * @param {string}   [payload.specialRequirements]
   * @param {string}   [payload.additionalNotes]
   * @param {string}   [payload.note]
   * @param {boolean}  [payload.submitForReview]
   */
  async clientUpdate(id, payload) {
    return this._request('PUT', `/negotiations/${id}/client-update`, payload);
  },

  async clientAgree(id) {
    return this._request('PUT', `/negotiations/${id}/client-agree`, { confirmAgreed: true });
  },

  // ─────────────────────────────────────────────
  // Caregiver actions
  // ─────────────────────────────────────────────
  /**
   * @param {string} id
   * @param {Object} payload
   * @param {string[]} [payload.proposedTasks]
   * @param {Array}    [payload.proposedSchedule]
   * @param {string}   [payload.serviceAddress]
   * @param {string}   [payload.accessInstructions]
   * @param {string}   [payload.additionalNotes]
   * @param {string}   [payload.note]
   * @param {boolean}  [payload.submitForReview]
   */
  async caregiverUpdate(id, payload) {
    return this._request('PUT', `/negotiations/${id}/caregiver-update`, payload);
  },

  async caregiverAgree(id) {
    return this._request('PUT', `/negotiations/${id}/caregiver-agree`, { confirmAgreed: true });
  },

  // ─────────────────────────────────────────────
  // Shared actions
  // ─────────────────────────────────────────────
  async abandon(id, reason = '') {
    return this._request('PUT', `/negotiations/${id}/abandon`, { reason });
  },

  /** Only valid when status === 'BothAgreed'. Creates the formal contract. */
  async convertToContract(id) {
    return this._request('POST', `/negotiations/${id}/convert-to-contract`);
  },

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  isTerminal(negotiation) {
    return !negotiation || negotiation.status === 'Abandoned' || negotiation.status === 'ConvertedToContract';
  },

  canEdit(negotiation, role) {
    if (!negotiation || this.isTerminal(negotiation)) return false;
    const s = negotiation.status;
    if (s === 'Drafting') return true;
    if (role === 'client' && s === 'PendingClientReview') return true;
    if (role === 'caregiver' && s === 'PendingCaregiverReview') return true;
    return false;
  },

  hasMyPartyAgreed(negotiation, role) {
    if (!negotiation) return false;
    return role === 'client' ? negotiation.clientAgreed : negotiation.caregiverAgreed;
  },

  getStatusInfo(status) {
    const map = {
      Drafting:               { label: 'Drafting',                color: '#888',    icon: '✏️' },
      PendingCaregiverReview: { label: 'Pending Caregiver Review', color: '#EFB214', icon: '⏳' },
      PendingClientReview:    { label: 'Pending Client Review',    color: '#EFB214', icon: '⏳' },
      BothAgreed:             { label: 'Both Agreed',              color: '#05668D', icon: '🤝' },
      ConvertedToContract:    { label: 'Contract Generated',       color: '#27ae60', icon: '📄' },
      Abandoned:              { label: 'Abandoned',                color: '#e74c3c', icon: '❌' },
    };
    return map[status] || { label: status || 'Unknown', color: '#888', icon: '📋' };
  },
};

export default NegotiationService;
