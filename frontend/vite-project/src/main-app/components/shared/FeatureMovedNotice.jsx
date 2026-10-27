import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './feature-moved-notice.css';

/**
 * Placeholder shown at the URL of a feature that has been retired while the
 * platform is rebuilt around care packages + internal caregiver assignment.
 *
 * Tier A (Unblock & De-Risk): the old competitive care-request / price-negotiation
 * flows call backend endpoints that no longer exist. Rather than let users land on
 * a screen that silently fails, each dead route renders this notice and points them
 * at the best currently-working destination. Swap individual routes over to their
 * real package-flow replacements as Tier B/D land.
 */
const ROLE_HOME = {
  Client: { path: '/app/client/dashboard', label: 'Go to my dashboard' },
  Caregiver: { path: '/app/caregiver/dashboard', label: 'Go to my dashboard' },
  Admin: { path: '/app/admin/dashboard', label: 'Go to admin home' },
  SuperAdmin: { path: '/app/admin/dashboard', label: 'Go to admin home' },
};

const readRole = () => {
  try {
    return JSON.parse(localStorage.getItem('userDetails') || '{}')?.role || '';
  } catch {
    return '';
  }
};

const FeatureMovedNotice = ({
  title = 'This section has moved',
  message = "We're rebuilding this around care packages. It will be back shortly.",
  homePath,
  homeLabel,
}) => {
  const navigate = useNavigate();

  const home = useMemo(() => {
    if (homePath) return { path: homePath, label: homeLabel || 'Continue' };
    return ROLE_HOME[readRole()] || { path: '/', label: 'Go to home' };
  }, [homePath, homeLabel]);

  return (
    <div className="feature-moved-notice">
      <div className="feature-moved-notice__card">
        <div className="feature-moved-notice__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1>{title}</h1>
        <p>{message}</p>
        <button type="button" className="feature-moved-notice__btn" onClick={() => navigate(home.path)}>
          {home.label}
        </button>
      </div>
    </div>
  );
};

export default FeatureMovedNotice;
