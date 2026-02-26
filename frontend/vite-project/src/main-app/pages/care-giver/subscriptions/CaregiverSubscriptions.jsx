import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionCard from '../../../components/subscriptions/SubscriptionCard';
import './CaregiverSubscriptions.css';

const STATUS_FILTERS = ['All', 'Active', 'PendingCancellation', 'PastDue', 'Suspended', 'Paused', 'Cancelled', 'Terminated', 'Expired', 'Charging'];

const CaregiverSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [summary, setSummary] = useState({ totalActive: 0, monthlyIncome: 0, totalClients: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await SubscriptionService.getCaregiverSubscriptions();
      if (result.success) {
        const items = Array.isArray(result.data) ? result.data : [];
        setSubscriptions(items);
        // Compute summary client-side
        const active = items.filter(s => s.status === 'Active');
        const monthlyIncome = active.reduce((sum, s) => sum + (s.recurringAmount || 0), 0);
        const uniqueClients = new Set(active.map(s => s.clientId)).size;
        setSummary({ totalActive: active.length, monthlyIncome, totalClients: uniqueClients });
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = filter === 'All'
    ? subscriptions
    : subscriptions.filter(s => s.status === filter);

  if (loading) {
    return (
      <div className="cg-subs-page">
        <div className="cg-subs-container">
          <div className="cg-subs__loading">Loading subscriptions…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cg-subs-page">
      <div className="cg-subs-container">
        <h1 className="cg-subs__title">Client Subscriptions</h1>
        <p className="cg-subs__subtitle">Recurring subscriptions linked to your services</p>

        {/* Summary Cards */}
        {subscriptions.length > 0 && (
          <div className="cg-subs__summary">
            <div className="cg-subs__stat-card">
              <span className="cg-subs__stat-label">Active</span>
              <span className="cg-subs__stat-value">{summary.totalActive}</span>
            </div>
            <div className="cg-subs__stat-card">
              <span className="cg-subs__stat-label">Monthly Income</span>
              <span className="cg-subs__stat-value">₦{summary.monthlyIncome.toLocaleString()}</span>
            </div>
            <div className="cg-subs__stat-card">
              <span className="cg-subs__stat-label">Total Clients</span>
              <span className="cg-subs__stat-value">{summary.totalClients}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {subscriptions.length > 0 && (
          <div className="cg-subs__filters">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`cg-subs__filter-btn ${filter === s ? 'cg-subs__filter-btn--active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'PendingCancellation' ? 'Cancelling' : s}
              </button>
            ))}
          </div>
        )}

        {error && <div className="cg-subs__error">{error}</div>}

        {filtered.length === 0 ? (
          <div className="cg-subs__empty">
            <p>{subscriptions.length === 0 ? 'No client subscriptions yet.' : `No subscriptions with status "${filter}".`}</p>
          </div>
        ) : (
          <div className="cg-subs__list">
            {filtered.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} basePath="/app/caregiver" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaregiverSubscriptions;
