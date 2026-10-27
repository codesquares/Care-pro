import { useNavigate } from 'react-router-dom';
import { useVettingLockout } from '../contexts/VettingLockoutContext';
import { MISSING_LABELS } from '../utils/vettingLockout';

/** Before the enforcement date: a banner on every caregiver page with a countdown, the missing steps and a link to the hub. */
export default function VettingNoticeBanner() {
  const { noticeActive, daysLeft, missing, enforcementDate } = useVettingLockout();
  const navigate = useNavigate();
  if (!noticeActive) return null;
  const when = enforcementDate
    ? enforcementDate.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  return (
    <div className="vetting-notice-banner" data-testid="vetting-notice-banner" role="status"
      style={{ background: '#fff8e1', borderBottom: '1px solid #ffe0a3', color: '#6b4e00', padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
      <strong>{daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}</strong> to finish your vetting (by {when}), or your account will be limited to the Vetting page, wallet, settings and messages.
      <ul style={{ margin: '0.3rem 0 0.4rem 1.1rem', padding: 0 }}>
        {missing.map((m) => <li key={m}>{MISSING_LABELS[m]}</li>)}
      </ul>
      <button type="button" onClick={() => navigate('/app/caregiver/vetting')}
        style={{ background: '#1e3a5f', color: '#fff', border: 0, borderRadius: 6, padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
        Go to Vetting
      </button>
    </div>
  );
}
