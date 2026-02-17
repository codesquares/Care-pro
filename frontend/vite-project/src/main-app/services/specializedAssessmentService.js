/**
 * Specialized Assessment Service
 * 
 * Handles all API calls for the specialized service assessment flow:
 * - Service requirements (public)
 * - Assessment questions per category
 * - Assessment submission & scoring
 * - Assessment history
 * - Eligibility checks
 * - Certificate status
 */
import api from './api';

const specializedAssessmentService = {

  // ─── Service Requirements (public, no auth required) ─────────────────────

  /**
   * Fetch all service requirements (tier, required certs, assessment config)
   * GET /api/Services/requirements
   * @returns {Promise<Array>} Array of ServiceRequirement objects
   */
  getServiceRequirements: async () => {
    try {
      const response = await api.get('/Services/requirements');
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching service requirements:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  // ─── Assessment Questions ─────────────────────────────────────────────────

  /**
   * Fetch specialized assessment questions for a service category.
   * GET /api/Assessments/questions?serviceCategory={category}&caregiverId={id}
   *
   * Response shape:
   *  { sessionId, serviceCategory, sessionDurationMinutes, expiresAt, questions: [...] }
   *
   * @param {string} serviceCategory - e.g. "MedicalSupport"
   * @param {string} caregiverId
   * @returns {Promise<Object>} { success, data: { sessionId, questions, expiresAt, ... } }
   */
  getQuestions: async (serviceCategory, caregiverId) => {
    try {
      const response = await api.get('/Assessments/questions', {
        params: { serviceCategory, caregiverId },
      });

      // New response is an object with sessionId + questions array
      const data = response.data || {};
      const questions = Array.isArray(data.questions) ? data.questions : [];

      return {
        success: true,
        data: {
          sessionId: data.sessionId || null,
          serviceCategory: data.serviceCategory || serviceCategory,
          sessionDurationMinutes: data.sessionDurationMinutes || null,
          expiresAt: data.expiresAt || null,
          questions,
        },
      };
    } catch (err) {
      if (err.response?.status === 400) {
        // 400 = caregiver already has an active session
        return {
          success: false,
          error: err.response.data?.message || 'You already have an active assessment session.',
          data: null,
        };
      }
      if (err.response?.status === 404) {
        return { success: false, error: 'No questions available for this category.', data: null };
      }
      console.error('Error fetching assessment questions:', err);
      return { success: false, error: err.message, data: null };
    }
  },

  // ─── Assessment Submission ─────────────────────────────────────────────────

  /**
   * Submit assessment answers for server-side scoring.
   * POST /api/Assessments/submit
   *
   * Request body:
   *  { userId, caregiverId, sessionId, serviceCategory, userType, status, score, questions }
   *
   * @param {string} caregiverId
   * @param {string} serviceCategory
   * @param {Object} answers - { questionId: selectedOption, ... }
   * @param {string} sessionId - required session ID from getQuestions
   * @returns {Promise<Object>}
   */
  submitAssessment: async (caregiverId, serviceCategory, answers, sessionId) => {
    try {
      // Build the questions array the backend expects
      const questionsPayload = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      }));

      const response = await api.post('/Assessments/submit', {
        userId: caregiverId,
        caregiverId,
        sessionId,
        serviceCategory,
        userType: 'Caregiver',
        status: 'Completed',
        score: 0, // server scores this
        questions: questionsPayload,
      });
      return { success: true, data: response.data };
    } catch (err) {
      // 429 = cooldown active OR session expired / already submitted
      if (err.response?.status === 429) {
        const msg = err.response.data?.message || err.response.data || '';
        const isExpired = typeof msg === 'string' && msg.toLowerCase().includes('expired');
        const isAlreadySubmitted = typeof msg === 'string' && msg.toLowerCase().includes('already been submitted');
        return {
          success: false,
          cooldown: !isExpired && !isAlreadySubmitted,
          sessionExpired: isExpired,
          sessionAlreadySubmitted: isAlreadySubmitted,
          data: err.response.data,
          error: typeof msg === 'string' ? msg : 'Cooldown period is active. Please wait before retrying.',
        };
      }
      if (err.response?.status === 400) {
        return {
          success: false,
          error: err.response.data?.message || 'Submitted questions do not match the session.',
          data: null,
        };
      }
      console.error('Error submitting assessment:', err);
      return { success: false, error: err.response?.data?.message || err.message, data: null };
    }
  },

  // ─── Assessment History ────────────────────────────────────────────────────

  /**
   * Get assessment history for a caregiver with pagination.
   * GET /api/Assessments/history?caregiverId={id}&serviceCategory={cat}&page={p}&pageSize={ps}
   *
   * Response shape:
   *  { items: [...], totalCount, page, pageSize, hasMore }
   *
   * @param {string} caregiverId
   * @param {string} [serviceCategory]
   * @param {number} [page=1]
   * @param {number} [pageSize=20]
   * @returns {Promise<Object>}
   */
  getHistory: async (caregiverId, serviceCategory = null, page = 1, pageSize = 20) => {
    try {
      const params = { caregiverId, page, pageSize };
      if (serviceCategory) params.serviceCategory = serviceCategory;
      const response = await api.get('/Assessments/history', { params });

      // New response is paginated object; old response was plain array
      const raw = response.data;
      if (Array.isArray(raw)) {
        // Backwards-compat: backend still returns plain array
        return { success: true, data: { items: raw, totalCount: raw.length, page: 1, pageSize: raw.length, hasMore: false } };
      }
      return {
        success: true,
        data: {
          items: raw.items || [],
          totalCount: raw.totalCount || 0,
          page: raw.page || page,
          pageSize: raw.pageSize || pageSize,
          hasMore: !!raw.hasMore,
        },
      };
    } catch (err) {
      console.error('Error fetching assessment history:', err);
      return { success: false, error: err.message, data: { items: [], totalCount: 0, page: 1, pageSize, hasMore: false } };
    }
  },

  // ─── Eligibility Check ────────────────────────────────────────────────────

  /**
   * Get per-category eligibility breakdown for a caregiver
   * GET /api/Assessments/eligibility?caregiverId={id}
   * @param {string} caregiverId
   * @returns {Promise<Object>} { success, data: { caregiverId, categories: { ... } } }
   */
  getEligibility: async (caregiverId) => {
    try {
      const response = await api.get('/Assessments/eligibility', {
        params: { caregiverId },
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching eligibility:', err);
      return { success: false, error: err.message, data: null };
    }
  },

  // ─── Certificate Status ───────────────────────────────────────────────────

  /**
   * Get certificate status for a caregiver
   * GET /api/Services/certificates/status?caregiverId={id}
   * @param {string} caregiverId
   * @returns {Promise<Object>} { success, data: Array<Certificate> }
   */
  getCertificateStatus: async (caregiverId) => {
    try {
      const response = await api.get('/Services/certificates/status', {
        params: { caregiverId },
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching certificate status:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  // ─── Helper: Parse 403 Eligibility Error ──────────────────────────────────

  /**
   * Parse a 403 eligibility error response from gig publish/update
   * @param {Object} errorResponse - axios error.response
   * @returns {Object|null} Parsed eligibility error or null
   */
  parsePublishEligibilityError: (errorResponse) => {
    if (errorResponse?.status !== 403) return null;
    const data = errorResponse.data;
    if (!data || data.error !== 'ELIGIBILITY_REQUIRED') return null;
    return {
      category: data.category,
      missing: data.missing || [],
      message: data.message || 'You are not eligible to publish gigs in this category.',
    };
  },
};

export default specializedAssessmentService;
