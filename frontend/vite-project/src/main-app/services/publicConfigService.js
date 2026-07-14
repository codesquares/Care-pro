import api from './api';

const PUBLIC_CONFIG_CACHE_TTL_MS = 60 * 1000;

let cachedCommitmentGateEnabled = true;
let cacheExpiresAt = 0;
let inFlightPromise = null;

const resolveCommitmentGateEnabled = (payload) => {
  if (typeof payload?.commitmentGateEnabled === 'boolean') {
    return payload.commitmentGateEnabled;
  }

  if (typeof payload?.data?.commitmentGateEnabled === 'boolean') {
    return payload.data.commitmentGateEnabled;
  }

  return true;
};

export const getCommitmentGateEnabled = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();

  if (!forceRefresh && now < cacheExpiresAt) {
    return cachedCommitmentGateEnabled;
  }

  if (!forceRefresh && inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const response = await api.get('/public-config', { timeout: 5000 });
      const enabled = resolveCommitmentGateEnabled(response?.data);
      cachedCommitmentGateEnabled = enabled;
      cacheExpiresAt = Date.now() + PUBLIC_CONFIG_CACHE_TTL_MS;
      return enabled;
    } catch {
      // Fail-safe behavior: if config cannot be loaded, treat gate as ON.
      cachedCommitmentGateEnabled = true;
      cacheExpiresAt = Date.now() + PUBLIC_CONFIG_CACHE_TTL_MS;
      return true;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

const publicConfigService = {
  getCommitmentGateEnabled,
};

export default publicConfigService;
