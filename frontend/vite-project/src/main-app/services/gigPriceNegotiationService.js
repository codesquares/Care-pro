/**
 * Gig Price Negotiation Service
 * Handles all pre-payment per-visit price negotiation operations.
 *
 * Two entry paths:
 *  - RegularGig:       client finds a gig, pays ₦5,000 commitment fee, then optionally negotiates
 *  - CareRequestHire:  client hires from a CareRequest response → negotiation created instead of booking
 *
 * All prices negotiated are per-visit rates.
 *
 * Error properties set on thrown errors:
 *   err.isConflict  = true  → HTTP 409 (version mismatch — re-fetch and let user decide)
 *   err.isTerminal  = true  → HTTP 410 (negotiation already Agreed/Rejected/Expired)
 */
import api from './api';

class GigPriceNegotiationService {
  // ─── Read operations ───────────────────────────────────────────────────────

  /**
   * Initiate a new negotiation for a regular gig (client only).
   * Idempotent: returns existing non-terminal negotiation if one already exists.
   *
   * @param {{ gigId: string, proposedPrice?: number, note?: string }} params
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async initiate({ gigId, proposedPrice, note } = {}) {
    const body = { gigId };
    if (proposedPrice !== undefined) body.proposedPrice = proposedPrice;
    if (note !== undefined) body.note = note;
    const response = await api.post('/gig-price-negotiation/initiate', body);
    return response.data?.data || response.data;
  }

  /**
   * Get full negotiation detail by ID (client or caregiver).
   *
   * @param {string} negotiationId
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async getById(negotiationId) {
    const response = await api.get(`/gig-price-negotiation/${negotiationId}`);
    return response.data?.data || response.data;
  }

  /**
   * Get the active negotiation for a gig (client only).
   * Returns null if no active negotiation exists (404 is caught).
   *
   * @param {string} gigId
   * @returns {Promise<GigPriceNegotiationResponseDTO|null>}
   */
  static async getByGig(gigId) {
    try {
      const response = await api.get(`/gig-price-negotiation/by-gig/${gigId}`);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  /**
   * Get negotiations pending the caregiver's action (caregiver only).
   *
   * @param {{ page?: number, pageSize?: number }} params
   * @returns {Promise<{ items: NegotiationSummaryDTO[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
   */
  static async getCaregiverPending({ page = 1, pageSize = 20 } = {}) {
    const response = await api.get('/gig-price-negotiation/caregiver/pending', {
      params: { page, pageSize },
    });
    return response.data?.data || response.data;
  }

  // ─── Write operations ──────────────────────────────────────────────────────

  /**
   * Client accepts the current proposed price.
   * On success, navigate to /app/client/cart/{result.gigIdForPayment}.
   *
   * @param {string} negotiationId
   * @param {{ version: number }} params
   * @returns {Promise<NegotiationAgreementResultDTO>}
   */
  static async accept(negotiationId, { version }) {
    try {
      const response = await api.post(`/gig-price-negotiation/${negotiationId}/accept`, { version });
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 409) err.isConflict = true;
      if (err.response?.status === 410) err.isTerminal = true;
      throw err;
    }
  }

  /**
   * Client proposes a new (lower) per-visit price.
   * Minimum ₦10,000. Max 3 proposals total (CanClientPropose will be false after that).
   *
   * @param {string} negotiationId
   * @param {{ proposedPrice: number, note?: string, version: number }} params
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async propose(negotiationId, { proposedPrice, note, version }) {
    try {
      const body = { proposedPrice, version };
      if (note !== undefined) body.note = note;
      const response = await api.post(`/gig-price-negotiation/${negotiationId}/propose`, body);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 409) err.isConflict = true;
      if (err.response?.status === 410) err.isTerminal = true;
      throw err;
    }
  }

  /**
   * Caregiver accepts the client's proposal or counter-proposes.
   * Max 3 counter-proposals (CanCaregiverCounter will be false after that).
   *
   * @param {string} negotiationId
   * @param {{ accept: boolean, counterPrice?: number, note?: string, version: number }} params
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async respond(negotiationId, { accept, counterPrice, note, version }) {
    try {
      const body = { accept, version };
      if (!accept && counterPrice !== undefined) body.counterPrice = counterPrice;
      if (note !== undefined) body.note = note;
      const response = await api.put(`/gig-price-negotiation/${negotiationId}/respond`, body);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 409) err.isConflict = true;
      if (err.response?.status === 410) err.isTerminal = true;
      throw err;
    }
  }

  /**
   * Either party rejects the negotiation.
   * For CareRequestHire path, rejecting does NOT undo the hire.
   *
   * @param {string} negotiationId
   * @param {{ reason?: string, version: number }} params
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async reject(negotiationId, { reason, version }) {
    try {
      const body = { version };
      if (reason !== undefined) body.reason = reason;
      const response = await api.post(`/gig-price-negotiation/${negotiationId}/reject`, body);
      return response.data?.data || response.data;
    } catch (err) {
      if (err.response?.status === 409) err.isConflict = true;
      if (err.response?.status === 410) err.isTerminal = true;
      throw err;
    }
  }

  /**
   * Re-initiate a negotiation for a CareRequest hire after rejection or expiry.
   * Idempotent: returns existing non-terminal negotiation if one already exists.
   * Only call this on the CareRequestHire path after Rejected or Expired status.
   *
   * @param {{ careRequestId: string, responseId: string }} params
   * @returns {Promise<GigPriceNegotiationResponseDTO>}
   */
  static async reinitiateForCareRequest({ careRequestId, responseId }) {
    const response = await api.post('/gig-price-negotiation/reinitiate-care-request', {
      careRequestId,
      responseId,
    });
    return response.data?.data || response.data;
  }
}

export default GigPriceNegotiationService;
