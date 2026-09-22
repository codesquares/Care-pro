/**
 * Caregiver Vetting Service
 * Self-service caregiver endpoints for Tier C vetting: classification,
 * guarantors, address history, and social media handles.
 * Consumes /api/caregiver/vetting/* (Authorize(Roles = "Caregiver") on the
 * backend). The caregiver id is always derived from the JWT server-side —
 * never passed by the frontend.
 *
 * One exception: `confirmGuarantorByToken` is called by a guarantor (not a
 * platform user) clicking the signed link in their confirmation email, so it
 * uses plain fetch with no auth header — same convention as
 * accountDeletionService.cancelByToken.
 */
import api from './api';
import config from '../config';

const BASE = '/caregiver/vetting';

export const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook', 'Instagram', 'X', 'Twitter', 'LinkedIn',
  'TikTok', 'Snapchat', 'YouTube', 'Threads', 'Other',
];

export const CAREGIVER_TYPES = [
  { value: 'AuxiliaryNurse', label: 'Auxiliary Nurse' },
  { value: 'CHEW', label: 'CHEW' },
  { value: 'RegisteredNurse', label: 'Registered Nurse' },
];

export const REQUIRED_GUARANTOR_COUNT = 2;

// Plain-language copy for each IneligibilityReasons code returned by
// GET /caregiver/vetting/readiness, plus where the caregiver can act on it.
export const READINESS_REASON_INFO = {
  not_identity_verified: {
    label: 'Verify your identity',
    description: "You haven't completed identity verification yet.",
    actionLabel: 'Verify identity',
    actionPath: '/app/caregiver/verification',
  },
  assessment_not_passed: {
    label: 'Pass your caregiver assessment',
    description: "You haven't passed the required caregiver assessment yet.",
    actionLabel: 'Take assessment',
    actionPath: '/app/caregiver/assessment',
  },
  no_active_gig: {
    label: 'Create an active gig',
    description: "You don't have an active gig listed yet.",
    actionLabel: 'Create a gig',
    actionPath: '/app/caregiver/create-gigs',
  },
  certificate_missing: {
    label: 'Upload a required certificate',
    description: 'A required professional certificate is missing from your profile.',
    actionLabel: 'Go to profile',
    actionPath: '/app/caregiver/profile',
  },
  guarantors_incomplete: {
    label: 'Add and confirm 2 guarantors',
    description: "You need 2 guarantors who've both clicked their confirmation email.",
    actionLabel: 'Manage guarantors',
    actionPath: '/app/caregiver/vetting/guarantors',
  },
  address_history_incomplete: {
    label: 'Complete your address history',
    description: 'Your address history needs to cover the last 5 years with no gaps.',
    actionLabel: 'Manage address history',
    actionPath: '/app/caregiver/vetting/address-history',
  },
  caregiver_type_not_set: {
    label: 'Set your caregiver classification',
    description: "You haven't set your caregiver type yet.",
    actionLabel: 'Set classification',
    actionPath: '/app/caregiver/vetting/classification',
  },
};

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || error?.message || fallback;
};

const caregiverVettingService = {
  // ── Readiness ────────────────────────────────────────────────────────────

  /**
   * GET /api/caregiver/vetting/readiness
   * The caller's own hire-readiness state, including IneligibilityReasons.
   * Caregiver id is always taken from the JWT server-side — there is no way
   * to request another caregiver's readiness.
   * @returns {Promise<{success: boolean, data?: {isReady, ineligibilityReasons, isIdentityVerified, hasActiveGig, assessmentPassed, hasTwoConfirmedGuarantors, addressHistoryComplete, caregiverTypeSet}, error?: string}>}
   */
  async getReadiness() {
    try {
      const response = await api.get(`${BASE}/readiness`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching readiness:', error);
      return { success: false, error: extractError(error, 'Failed to load readiness status') };
    }
  },

  // ── Classification ──────────────────────────────────────────────────────

  /**
   * GET /api/caregiver/vetting/classification
   * @returns {Promise<{success: boolean, data?: {caregiverId, caregiverType, specialty}, error?: string}>}
   */
  async getClassification() {
    try {
      const response = await api.get(`${BASE}/classification`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) return { success: true, data: null };
      console.error('Error fetching classification:', error);
      return { success: false, error: extractError(error, 'Failed to load classification') };
    }
  },

  /**
   * PUT /api/caregiver/vetting/classification
   * @param {{caregiverType: string, specialty?: string}} payload
   */
  async setClassification({ caregiverType, specialty }) {
    try {
      const response = await api.put(`${BASE}/classification`, { caregiverType, specialty: specialty || null });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving classification:', error);
      return { success: false, error: extractError(error, 'Failed to save classification') };
    }
  },

  // ── Guarantors ───────────────────────────────────────────────────────────

  /**
   * GET /api/caregiver/vetting/guarantors
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getGuarantors() {
    try {
      const response = await api.get(`${BASE}/guarantors`);
      return { success: true, data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error('Error fetching guarantors:', error);
      return { success: false, error: extractError(error, 'Failed to load guarantors') };
    }
  },

  /**
   * POST /api/caregiver/vetting/guarantors — max 2, backend returns 409 past that.
   * @param {{name, relationshipToCaregiver, phoneNo, email, address}} payload
   */
  async addGuarantor(payload) {
    try {
      const response = await api.post(`${BASE}/guarantors`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding guarantor:', error);
      return { success: false, error: extractError(error, 'Failed to add guarantor') };
    }
  },

  /**
   * PUT /api/caregiver/vetting/guarantors/{id} — only allowed while status is "pending".
   */
  async updateGuarantor(id, payload) {
    try {
      const response = await api.put(`${BASE}/guarantors/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating guarantor:', error);
      return { success: false, error: extractError(error, 'Failed to update guarantor') };
    }
  },

  /**
   * DELETE /api/caregiver/vetting/guarantors/{id}
   */
  async deleteGuarantor(id) {
    try {
      await api.delete(`${BASE}/guarantors/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting guarantor:', error);
      return { success: false, error: extractError(error, 'Failed to remove guarantor') };
    }
  },

  /**
   * POST /api/caregiver/vetting/guarantors/{id}/send-confirmation
   * Triggers (or resends) the confirmation email. Subject to a 60-minute resend
   * cooldown and a lifetime attempt cap — both enforced server-side (409s).
   */
  async sendGuarantorConfirmation(id) {
    try {
      const response = await api.post(`${BASE}/guarantors/${id}/send-confirmation`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending guarantor confirmation:', error);
      return { success: false, error: extractError(error, 'Failed to send confirmation email') };
    }
  },

  /**
   * POST /api/caregiver/vetting/guarantors/confirm?token=... — AllowAnonymous.
   * Called by the guarantor from the emailed link, not by the logged-in caregiver.
   * Uses plain fetch: no auth token should be attached.
   * @param {string} token
   */
  async confirmGuarantorByToken(token) {
    try {
      const url = `${config.BASE_URL}${BASE}/guarantors/confirm?token=${encodeURIComponent(token)}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(data?.message || 'Request failed');
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error?.data?.message || error?.message || 'Failed to confirm guarantor',
      };
    }
  },

  // ── Address history ─────────────────────────────────────────────────────

  /**
   * GET /api/caregiver/vetting/address-history
   */
  async getAddressHistory() {
    try {
      const response = await api.get(`${BASE}/address-history`);
      return { success: true, data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error('Error fetching address history:', error);
      return { success: false, error: extractError(error, 'Failed to load address history') };
    }
  },

  /**
   * GET /api/caregiver/vetting/address-history/coverage
   * @returns {Promise<{success, data?: {isComplete, recordCount, requiredCount, requiredYears}, error?}>}
   */
  async getAddressHistoryCoverage() {
    try {
      const response = await api.get(`${BASE}/address-history/coverage`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching address history coverage:', error);
      return { success: false, error: extractError(error, 'Failed to load coverage status') };
    }
  },

  /**
   * POST /api/caregiver/vetting/address-history
   * @param {{address: string, movedIn: string, movedOut?: string|null}} payload
   */
  async addAddressHistory(payload) {
    try {
      const response = await api.post(`${BASE}/address-history`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding address history entry:', error);
      return { success: false, error: extractError(error, 'Failed to add address history entry') };
    }
  },

  /**
   * PUT /api/caregiver/vetting/address-history/{id}
   */
  async updateAddressHistory(id, payload) {
    try {
      const response = await api.put(`${BASE}/address-history/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating address history entry:', error);
      return { success: false, error: extractError(error, 'Failed to update address history entry') };
    }
  },

  /**
   * DELETE /api/caregiver/vetting/address-history/{id}
   */
  async deleteAddressHistory(id) {
    try {
      await api.delete(`${BASE}/address-history/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting address history entry:', error);
      return { success: false, error: extractError(error, 'Failed to remove address history entry') };
    }
  },

  // ── Social media handles ────────────────────────────────────────────────

  /**
   * GET /api/caregiver/vetting/social-media
   */
  async getSocialMediaHandles() {
    try {
      const response = await api.get(`${BASE}/social-media`);
      return { success: true, data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error('Error fetching social media handles:', error);
      return { success: false, error: extractError(error, 'Failed to load social media handles') };
    }
  },

  /**
   * POST /api/caregiver/vetting/social-media
   * @param {{platform: string, handle: string}} payload
   */
  async addSocialMediaHandle(payload) {
    try {
      const response = await api.post(`${BASE}/social-media`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding social media handle:', error);
      return { success: false, error: extractError(error, 'Failed to add social media handle') };
    }
  },

  /**
   * PUT /api/caregiver/vetting/social-media/{id}
   */
  async updateSocialMediaHandle(id, payload) {
    try {
      const response = await api.put(`${BASE}/social-media/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating social media handle:', error);
      return { success: false, error: extractError(error, 'Failed to update social media handle') };
    }
  },

  /**
   * DELETE /api/caregiver/vetting/social-media/{id}
   */
  async deleteSocialMediaHandle(id) {
    try {
      await api.delete(`${BASE}/social-media/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting social media handle:', error);
      return { success: false, error: extractError(error, 'Failed to remove social media handle') };
    }
  },
};

export default caregiverVettingService;
