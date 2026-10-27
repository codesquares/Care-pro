import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import caregiverVettingService, { VETTING_DATA_CHANGED_EVENT } from '../services/caregiverVettingService';
import { getVettingLockoutEnforcementDate } from '../services/publicConfigService';
import { computeLockState } from '../utils/vettingLockout';

const SYNC_KEY = 'carepro_vetting_lockout_refreshed_at'; // bumped after a refresh so OTHER tabs re-evaluate (storage event)
const RETRY_MS = 30000;
const TICK_MS = 60000;

const FAIL_OPEN = { status: 'idle', locked: false, noticeActive: false, enforcementDate: null, daysLeft: 0, missing: [], clearance: null, refresh: async () => {} };
const VettingLockoutContext = createContext(FAIL_OPEN);

export const useVettingLockout = () => useContext(VettingLockoutContext);

/**
 * Fetches classification, guarantors, address-history coverage, readiness (for the clearance state) and the lockout date ONCE on
 * mount, derives the lock state, and exposes refresh(). Any failure => status 'error' => NOT locked (fail open), retried every 30s.
 */
export function VettingLockoutProvider({ children }) {
  const [inputs, setInputs] = useState(null);       // null until the first successful load
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [now, setNow] = useState(() => new Date());
  const alive = useRef(true);
  const retryTimer = useRef(null);

  const load = useCallback(async (broadcast = false) => {
    try {
      const [date, cls, guarantors, coverage, readiness] = await Promise.all([
        getVettingLockoutEnforcementDate(),
        caregiverVettingService.getClassification(),
        caregiverVettingService.getGuarantors(),
        caregiverVettingService.getAddressHistoryCoverage(),
        caregiverVettingService.getReadiness(),
      ]);
      if (!alive.current) return;
      if (![cls, guarantors, coverage, readiness].every((r) => r?.success)) throw new Error('vetting state unavailable');
      setInputs({
        enforcementDate: date,
        classificationSet: !!cls.data?.caregiverType,
        guarantorCount: (guarantors.data || []).length,
        // Like guarantors and police clearance, the lockout only needs the step SUBMITTED: dates covered and the current-address
        // bill uploaded (awaiting review counts). Staff approval is not required to lift it. Older servers send no `state`.
        addressComplete: coverage.data?.state ? coverage.data.state !== 'incomplete' : !!coverage.data?.isComplete,
        clearance: { status: readiness.data?.policeClearanceStatus || 'none', enforced: readiness.data?.policeClearanceEnforced === true },
      });
      setStatus('ready');
      clearTimeout(retryTimer.current);
      if (broadcast) { try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch { /* storage unavailable */ } }
    } catch {
      if (!alive.current) return;
      setStatus((s) => (s === 'ready' ? s : 'error')); // keep the last good state if we had one; otherwise fail open
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => load(false), RETRY_MS);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load(false);
    const onChanged = () => load(true);
    const onStorage = (e) => { if (e.key === SYNC_KEY) load(false); };
    window.addEventListener(VETTING_DATA_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onStorage);
    const tick = setInterval(() => setNow(new Date()), TICK_MS);
    return () => {
      alive.current = false;
      clearTimeout(retryTimer.current);
      clearInterval(tick);
      window.removeEventListener(VETTING_DATA_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [load]);

  const value = useMemo(() => {
    const state = computeLockState({ ready: status === 'ready' && !!inputs, ...(inputs || {}), now });
    return { status, ...state, clearance: inputs?.clearance || null, refresh: () => load(true) };
  }, [status, inputs, now, load]);

  return <VettingLockoutContext.Provider value={value}>{children}</VettingLockoutContext.Provider>;
}

export default VettingLockoutContext;
