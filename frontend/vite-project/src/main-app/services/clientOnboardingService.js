import api from './api';

export const WALKTHROUGH_CONTENT_VERSION = 'client-quickstart-v1';

export const QUICKSTART_STEPS = [
  'step_1_dashboard_orientation',
  'step_2_marketplace_search',
  'step_3_service_detail_actions',
  'step_4_checkout_basics',
  'step_5_commitment_explainer_conditional',
];

const mapResponseData = (response) => response?.data?.data || response?.data || {};

const pick = (obj, camelKey, pascalKey) => {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, camelKey)) return obj[camelKey];
  if (Object.prototype.hasOwnProperty.call(obj, pascalKey)) return obj[pascalKey];
  return undefined;
};

const normalizeStepState = (stepState) => ({
  stepKey: pick(stepState, 'stepKey', 'StepKey') || null,
  state: pick(stepState, 'state', 'State') || null,
  updatedAt: pick(stepState, 'updatedAt', 'UpdatedAt') || null,
});

const normalizeWalkthrough = (walkthrough) => {
  if (!walkthrough) return null;

  const rawStepStates = pick(walkthrough, 'stepStates', 'StepStates');

  return {
    contentVersion: pick(walkthrough, 'contentVersion', 'ContentVersion') || null,
    status: pick(walkthrough, 'status', 'Status') || null,
    currentStep: pick(walkthrough, 'currentStep', 'CurrentStep') || null,
    stepStates: Array.isArray(rawStepStates) ? rawStepStates.map(normalizeStepState) : [],
    startedAt: pick(walkthrough, 'startedAt', 'StartedAt') || null,
    completedAt: pick(walkthrough, 'completedAt', 'CompletedAt') || null,
    dismissedAt: pick(walkthrough, 'dismissedAt', 'DismissedAt') || null,
    version: pick(walkthrough, 'version', 'Version') ?? 0,
  };
};

const normalizeSeenTip = (tip) => ({
  tipKey: pick(tip, 'tipKey', 'TipKey') || null,
  seenAt: pick(tip, 'seenAt', 'SeenAt') || null,
  context: pick(tip, 'context', 'Context') || {},
  displayVariant: pick(tip, 'displayVariant', 'DisplayVariant') || null,
  firstSeenAt: pick(tip, 'firstSeenAt', 'FirstSeenAt') || null,
  lastSeenAt: pick(tip, 'lastSeenAt', 'LastSeenAt') || null,
});

const normalizeStatePayload = (payload) => {
  const walkthrough = normalizeWalkthrough(pick(payload, 'walkthrough', 'Walkthrough'));
  const seenTipsRaw = pick(payload, 'seenTips', 'SeenTips');

  return {
    walkthrough,
    seenTips: Array.isArray(seenTipsRaw) ? seenTipsRaw.map(normalizeSeenTip) : [],
  };
};

const logOnboardingNetwork = ({ method, endpoint, requestBody = null, responseBody = null, status = null, error = null }) => {
  if (typeof window === 'undefined') return;

  const entry = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    requestBody,
    responseBody,
    status,
    error: error ? String(error) : null,
  };

  const current = Array.isArray(window.__onboardingNetLog) ? window.__onboardingNetLog : [];
  const next = [entry, ...current].slice(0, 200);
  window.__onboardingNetLog = next;
};

const clientOnboardingService = {
  async getState() {
    const endpoint = '/client-onboarding/state';
    const response = await api.get(endpoint);
    const normalized = normalizeStatePayload(mapResponseData(response));
    logOnboardingNetwork({
      method: 'GET',
      endpoint,
      responseBody: normalized,
      status: response?.status || 200,
    });
    return normalized;
  },

  async updateWalkthrough(payload) {
    try {
      const endpoint = '/client-onboarding/walkthrough';
      const response = await api.patch(endpoint, payload);
      const normalized = normalizeStatePayload(mapResponseData(response));
      logOnboardingNetwork({
        method: 'PATCH',
        endpoint,
        requestBody: payload,
        responseBody: normalized,
        status: response?.status || 200,
      });
      return {
        ok: true,
        data: normalized,
      };
    } catch (error) {
      const endpoint = '/client-onboarding/walkthrough';
      if (error?.response?.status === 409) {
        const conflictPayload = mapResponseData(error.response);
        const latestState = pick(conflictPayload, 'latestState', 'LatestState');
        const normalizedConflict = latestState ? normalizeStatePayload(latestState) : null;
        logOnboardingNetwork({
          method: 'PATCH',
          endpoint,
          requestBody: payload,
          responseBody: normalizedConflict,
          status: 409,
          error: pick(error?.response?.data, 'Message', 'message') || 'VERSION_CONFLICT',
        });
        return {
          ok: false,
          conflict: true,
          data: normalizedConflict,
          error,
        };
      }

      logOnboardingNetwork({
        method: 'PATCH',
        endpoint,
        requestBody: payload,
        responseBody: null,
        status: error?.response?.status || null,
        error: error?.response?.data?.message || error?.message || 'PATCH failed',
      });

      return {
        ok: false,
        conflict: false,
        error,
      };
    }
  },

  async markTipSeen(payload) {
    const endpoint = '/client-onboarding/tips/seen';
    const response = await api.post(endpoint, payload);
    const normalized = normalizeSeenTip(mapResponseData(response));
    logOnboardingNetwork({
      method: 'POST',
      endpoint,
      requestBody: payload,
      responseBody: normalized,
      status: response?.status || 200,
    });
    return normalized;
  },
};

export default clientOnboardingService;
