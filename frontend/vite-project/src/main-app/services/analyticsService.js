import api from './api';

/**
 * Analytics service for tracking marketing/ad events.
 *
 * Captures the Facebook click ID (fbclid) from the URL on first visit,
 * persists it in sessionStorage so subsequent events in the same session
 * remain attributed to the original Facebook ad click, and forwards
 * tracked events to the backend.
 */

const FBCLID_STORAGE_KEY = 'analytics_fbclid';

/**
 * Read fbclid from current URL and persist to sessionStorage if present.
 * Should be called once on app load.
 */
export const captureFbclidFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      sessionStorage.setItem(FBCLID_STORAGE_KEY, fbclid);
    }
  } catch {
    // Ignore — sessionStorage may be unavailable (e.g. SSR, locked-down browsers)
  }
};

/**
 * Returns the persisted fbclid for this session, or null.
 */
export const getStoredFbclid = () => {
  try {
    return sessionStorage.getItem(FBCLID_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

/**
 * Send an analytics event to the backend.
 * Failures are swallowed — analytics must never break user flows.
 *
 * @param {string} eventType - e.g. "page_view", "cta_click", "signup_complete"
 * @param {string} page - e.g. "become_caregiver", "marketplace"
 */
export const trackEvent = async (eventType, page) => {
  if (!eventType || !page) return;

  const payload = {
    eventType,
    page,
    fbclid: getStoredFbclid(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };

  try {
    await api.post('/Analytics/Event', payload);
  } catch (err) {
    // Silent fail — analytics is non-critical
    if (import.meta.env?.DEV) {
      console.warn('[analytics] trackEvent failed:', err?.message || err);
    }
  }
};

/**
 * Fetch analytics events for the admin view.
 *
 * @param {Object} filters
 * @param {string} [filters.startDate] - ISO 8601
 * @param {string} [filters.endDate] - ISO 8601
 * @param {string} [filters.eventType]
 * @param {string} [filters.page]
 * @param {number} [filters.pageNumber=1]
 * @param {number} [filters.pageSize=50]
 */
export const getAnalyticsEvents = async (filters = {}) => {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.eventType) params.eventType = filters.eventType;
  if (filters.page) params.page = filters.page;
  params.pageNumber = filters.pageNumber || 1;
  params.pageSize = filters.pageSize || 50;

  const response = await api.get('/Analytics/Events', { params });
  return response.data;
};

export default {
  captureFbclidFromUrl,
  getStoredFbclid,
  trackEvent,
  getAnalyticsEvents,
};
