import { Navigate, useLocation } from 'react-router-dom';
import { useVettingLockout } from '../contexts/VettingLockoutContext';
import { isPathOpenWhileLocked, lockRedirectFor } from '../utils/vettingLockout';

/**
 * Wraps the caregiver <Routes>. Evaluated on every render, so it covers SPA navigation AND a full page reload (the Google login
 * path): on reload the lock state is re-fetched, and a not-yet-known state holds back locked pages instead of flashing them.
 * Loading that never resolves, or any failure, ends in status 'error' => fail open.
 */
export default function VettingLockGuard({ children }) {
  const { pathname } = useLocation();
  const lock = useVettingLockout();

  if (lock.status === 'loading' && !isPathOpenWhileLocked(pathname)) {
    return <div data-testid="vetting-lock-checking" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Checking your account…</div>;
  }
  const target = lockRedirectFor(pathname, lock);
  if (target) return <Navigate to={target} replace />;
  return children;
}
