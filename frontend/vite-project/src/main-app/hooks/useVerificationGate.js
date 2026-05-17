/**
 * useVerificationGate
 *
 * Owns the eligibility/gate state for the Dojah verification flow.
 * - Fetches GET /Dojah/eligibility on mount.
 * - Exposes a manual `refresh()` for callers (e.g. after a blocked
 *   initiate-session 403 response, when the cooldown timer expires,
 *   or after the SignalR VerificationStatusChanged event fires).
 * - Auto-refetches when a `cooldown_active` window elapses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getEligibility } from '../services/dojahGateService';

export default function useVerificationGate() {
  const [gate, setGate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEligibility();
      if (!isMountedRef.current) return;
      setGate(data);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('useVerificationGate: eligibility fetch failed', err);
      setError(err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Initial load + cleanup
  useEffect(() => {
    isMountedRef.current = true;
    refresh();
    return () => {
      isMountedRef.current = false;
    };
  }, [refresh]);

  // Auto-refresh on cooldown expiry
  useEffect(() => {
    if (!gate || gate.reason !== 'cooldown_active' || !gate.cooldownUntil) return;
    const ms = new Date(gate.cooldownUntil).getTime() - Date.now();
    if (ms <= 0) {
      refresh();
      return;
    }
    // +1s buffer so backend has settled the window
    const t = setTimeout(refresh, ms + 1000);
    return () => clearTimeout(t);
  }, [gate, refresh]);

  /**
   * Apply a gate object pulled from a 403 initiate-session response so the
   * UI re-renders without a second eligibility round-trip.
   */
  const applyGate = useCallback((nextGate) => {
    if (!isMountedRef.current) return;
    setGate(nextGate);
  }, []);

  return { gate, loading, error, refresh, applyGate };
}
