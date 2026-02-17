import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import './CaregiverSubscriptionWidget.css';

/**
 * Subscription summary widget for the caregiver dashboard.
 * Shows client subscriptions linked to this caregiver's gigs.
 */
const CaregiverSubscriptionWidget = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const result = await SubscriptionService.getCaregiverSubscriptions();
        if (result.success && Array.isArray(result.data)) {
          setSubscriptions(result.data);
        }
      } catch (err) {
        console.warn('Could not fetch caregiver subscriptions:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  // Don't render during loading or if there's an error
  if (loading || error) return null;

  // Don't render if no subscriptions
  if (subscriptions.length === 0) return null;

  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const totalRecurring = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + (s.recurringAmount || 0), 0);

  return (
    <div className="cg-sub-widget">
      <div className="cg-sub-widget__header">
        <h3 className="cg-sub-widget__title">
          <span className="cg-sub-widget__icon">🔄</span>
          Client Subscriptions
        </h3>
        <button
          className="cg-sub-widget__view-all"
          onClick={() => navigate('/app/caregiver/subscriptions')}
        >
          View All →
        </button>
      </div>

      <div className="cg-sub-widget__stats">
        <div className="cg-sub-widget__stat">
          <span className="cg-sub-widget__stat-value">{activeCount}</span>
          <span className="cg-sub-widget__stat-label">Active</span>
        </div>
        <div className="cg-sub-widget__stat">
          <span className="cg-sub-widget__stat-value">{subscriptions.length}</span>
          <span className="cg-sub-widget__stat-label">Total</span>
        </div>
        {totalRecurring > 0 && (
          <div className="cg-sub-widget__stat">
            <span className="cg-sub-widget__stat-value">₦{totalRecurring.toLocaleString()}</span>
            <span className="cg-sub-widget__stat-label">Recurring Revenue</span>
          </div>
        )}
      </div>

      <div className="cg-sub-widget__items">
        {subscriptions.slice(0, 3).map((sub) => (
          <div
            key={sub.id}
            className="cg-sub-widget__item"
            onClick={() => navigate(`/app/caregiver/subscriptions/${sub.id}`)}
          >
            <div className="cg-sub-widget__item-info">
              <span className="cg-sub-widget__item-name">
                {sub.clientName || sub.gigTitle || 'Subscription'}
              </span>
              <span className={`cg-sub-widget__item-status cg-sub-widget__item-status--${(sub.status || '').toLowerCase()}`}>
                {sub.status}
              </span>
            </div>
            {sub.recurringAmount > 0 && (
              <span className="cg-sub-widget__item-amount">
                ₦{sub.recurringAmount.toLocaleString()}/{sub.billingCycle || 'month'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaregiverSubscriptionWidget;
