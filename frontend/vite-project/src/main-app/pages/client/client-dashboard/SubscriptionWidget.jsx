import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import './SubscriptionWidget.css';

/**
 * Subscription summary widget for the client dashboard.
 * Shows active subscriptions and quick links to manage them.
 */
const SubscriptionWidget = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const result = await SubscriptionService.getClientSubscriptionSummary();
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          // Try basic list as fallback
          const listResult = await SubscriptionService.getClientSubscriptions();
          if (listResult.success && Array.isArray(listResult.data) && listResult.data.length > 0) {
            const active = listResult.data.filter(s => s.status === 'Active');
            setSummary({
              totalActive: active.length,
              totalMonthlySpend: 0,
              subscriptions: listResult.data
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch subscription summary:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Don't render during loading or if there's an error
  if (loading || error) return null;

  // Don't render if no subscriptions at all
  if (!summary || (!summary.totalActive && (!summary.subscriptions || summary.subscriptions.length === 0))) {
    return null;
  }

  const activeCount = summary.totalActive || 0;
  const monthlySpend = summary.totalMonthlySpend || 0;
  const nextPayment = summary.nextPaymentDate
    ? new Date(summary.nextPaymentDate).toLocaleDateString()
    : null;

  return (
    <div className="sub-widget">
      <div className="sub-widget__header">
        <h3 className="sub-widget__title">
          <span className="sub-widget__icon">🔄</span>
          My Subscriptions
        </h3>
        <button
          className="sub-widget__view-all"
          onClick={() => navigate('/app/client/subscriptions')}
        >
          View All →
        </button>
      </div>

      <div className="sub-widget__stats">
        <div className="sub-widget__stat">
          <span className="sub-widget__stat-value">{activeCount}</span>
          <span className="sub-widget__stat-label">Active</span>
        </div>
        {monthlySpend > 0 && (
          <div className="sub-widget__stat">
            <span className="sub-widget__stat-value">₦{monthlySpend.toLocaleString()}</span>
            <span className="sub-widget__stat-label">Monthly Spend</span>
          </div>
        )}
        {nextPayment && (
          <div className="sub-widget__stat">
            <span className="sub-widget__stat-value">{nextPayment}</span>
            <span className="sub-widget__stat-label">Next Payment</span>
          </div>
        )}
      </div>

      {summary.subscriptions && summary.subscriptions.length > 0 && (
        <div className="sub-widget__items">
          {summary.subscriptions.slice(0, 3).map((sub) => (
            <div
              key={sub.id}
              className="sub-widget__item"
              onClick={() => navigate(`/app/client/subscriptions/${sub.id}`)}
            >
              <div className="sub-widget__item-info">
                <span className="sub-widget__item-name">
                  {sub.gigTitle || sub.serviceName || 'Subscription'}
                </span>
                <span className={`sub-widget__item-status sub-widget__item-status--${(sub.status || '').toLowerCase()}`}>
                  {sub.status}
                </span>
              </div>
              {sub.recurringAmount > 0 && (
                <span className="sub-widget__item-amount">
                  ₦{sub.recurringAmount.toLocaleString()}/{sub.billingCycle || 'month'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionWidget;
