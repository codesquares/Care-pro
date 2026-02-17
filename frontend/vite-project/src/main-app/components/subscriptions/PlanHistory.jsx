import { useState, useEffect } from 'react';
import SubscriptionService from '../../services/subscriptionService';
import './PlanHistory.css';

/**
 * Shows past plan changes for a subscription.
 * @param {{ subscriptionId: string }} props
 */
const PlanHistory = ({ subscriptionId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const result = await SubscriptionService.getPlanHistory(subscriptionId);
      if (result.success) setHistory(result.data || []);
      setLoading(false);
    };
    if (subscriptionId) fetch();
  }, [subscriptionId]);

  if (loading) return <p className="plan-history__loading">Loading plan history…</p>;
  if (history.length === 0) return null; // Don't render if no changes

  return (
    <div className="plan-history">
      <h4 className="plan-history__title">Plan Change History</h4>
      <ul className="plan-history__list">
        {history.map((h, idx) => (
          <li key={idx} className="plan-history__item">
            <span className="plan-history__date">
              {h.changedAt ? new Date(h.changedAt).toLocaleDateString() : '—'}
            </span>
            <span className="plan-history__detail">
              {h.changeType === 'upgrade' ? '⬆' : '⬇'}{' '}
              {h.previousBillingCycle} → {h.newBillingCycle}
              {h.previousFrequency !== h.newFrequency &&
                ` · ${h.previousFrequency}x → ${h.newFrequency}x per week`}
            </span>
            <span className="plan-history__amounts">
              ₦{(h.previousAmount || 0).toLocaleString()} → ₦{(h.newAmount || 0).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanHistory;
