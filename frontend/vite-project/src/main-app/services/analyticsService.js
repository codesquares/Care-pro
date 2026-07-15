import api from './api';

const ANALYTICS_PERMISSION_MESSAGE = 'You do not have analytics access for this dashboard.';

const getAnalyticsErrorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return ANALYTICS_PERMISSION_MESSAGE;
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.errorMessage) return data.errorMessage;
  if (data?.title) return data.title;
  return fallback;
};

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

  try {
    const response = await api.get('/Analytics/Events', { params });
    return response.data;
  } catch (error) {
    throw new Error(getAnalyticsErrorMessage(error, 'Failed to load analytics events.'));
  }
};

/**
 * Admin gig views overview.
 * GET /api/admin/analytics/gig-views/overview
 */
export const fetchGigViewsOverview = async (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;

  try {
    const response = await api.get('/admin/analytics/gig-views/overview', { params });
    return response.data;
  } catch (error) {
    throw new Error(getAnalyticsErrorMessage(error, 'Failed to load gig views overview.'));
  }
};

/**
 * Admin top viewed gigs.
 * GET /api/admin/analytics/gig-views/top
 */
export const fetchTopGigViews = async (limit = 20, from, to) => {
  const params = { limit };
  if (from) params.from = from;
  if (to) params.to = to;

  try {
    const response = await api.get('/admin/analytics/gig-views/top', { params });
    return response.data;
  } catch (error) {
    throw new Error(getAnalyticsErrorMessage(error, 'Failed to load top gig views.'));
  }
};

/**
 * Admin gig views timeseries.
 * GET /api/admin/analytics/gig-views/{gigId}/timeseries
 */
export const fetchGigViewsTimeseries = async (gigId, bucket = 'day', from, to) => {
  const params = { bucket };
  if (from) params.from = from;
  if (to) params.to = to;

  try {
    const response = await api.get(`/admin/analytics/gig-views/${gigId}/timeseries`, { params });
    return response.data;
  } catch (error) {
    throw new Error(getAnalyticsErrorMessage(error, 'Failed to load gig views timeseries.'));
  }
};

export default {
  captureFbclidFromUrl,
  getStoredFbclid,
  trackEvent,
  getAnalyticsEvents,
  fetchGigViewsOverview,
  fetchTopGigViews,
  fetchGigViewsTimeseries,
};
