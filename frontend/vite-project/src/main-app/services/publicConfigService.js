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

// ── Caregiver vetting lockout date ──────────────────────────────────────────
// One global ISO date. Unset, unparseable or a failed request => null => NOT enforced. This is deliberately FAIL-OPEN, the
// opposite of the commitment gate above (which fails closed): wrongly locking caregivers out on a network error is worse.
let cachedLockoutDate = null;
let lockoutCacheExpiresAt = 0;

export const getVettingLockoutEnforcementDate = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && Date.now() < lockoutCacheExpiresAt) return cachedLockoutDate;
  try {
    const response = await api.get('/public-config', { timeout: 5000 });
    const raw = response?.data?.vettingLockoutEnforcementDate ?? response?.data?.data?.vettingLockoutEnforcementDate ?? null;
    cachedLockoutDate = raw && !Number.isNaN(new Date(raw).getTime()) ? raw : null;
    lockoutCacheExpiresAt = Date.now() + PUBLIC_CONFIG_CACHE_TTL_MS;
  } catch {
    cachedLockoutDate = null;
    lockoutCacheExpiresAt = 0; // don't cache a failure; retry next time
  }
  return cachedLockoutDate;
};

const publicConfigService = {
  getCommitmentGateEnabled,
  getVettingLockoutEnforcementDate,
};

export default publicConfigService;
