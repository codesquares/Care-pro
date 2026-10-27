import { useNavigate } from 'react-router-dom';
import './careNeedsSummaryCard.css';

/**
 * Replaces the retired CareNeedsSummaryCard. Two real next steps for a client: talk to the care team
 * (free assessment over WhatsApp — the actual intake for a care package) and track existing requests.
 * Package browsing already has its own card at the top of the dashboard hero.
 */
const CareGetStartedCards = () => {
  const navigate = useNavigate();

  return (
    <div className="care-needs-card-wrapper">
      <div className="care-needs-card setup-card" onClick={() => navigate('/start-assessment')}>
        <div className="cn-card-icon setup-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="cn-card-content">
          <span className="cn-card-label">FREE CARE ASSESSMENT</span>
          <span className="cn-card-title">Talk to our care team</span>
          <span className="cn-card-subtitle">Tell us what you need and we'll assign a vetted caregiver</span>
        </div>
        <div className="cn-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>

      <div className="care-needs-card match-card" onClick={() => navigate('/app/client/requests')}>
        <div className="cn-card-icon match-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="cn-card-content">
          <span className="cn-card-label match">MY REQUESTS</span>
          <span className="cn-card-title">Track your care requests</span>
        </div>
        <div className="cn-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CareGetStartedCards;
