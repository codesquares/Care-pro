import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionCard from '../../../components/subscriptions/SubscriptionCard';
import './ClientSubscriptions.css';

const STATUS_FILTERS = ['All', 'Active', 'PendingCancellation', 'PastDue', 'Suspended', 'Paused', 'Cancelled', 'Terminated', 'Expired', 'Charging'];

const ClientSubscriptions = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await SubscriptionService.getClientSubscriptionSummary();
      if (result.success) {
        setSummary(result.data);
        const subs = Array.isArray(result.data?.subscriptions) ? result.data.subscriptions : [];
        setSubscriptions(subs);
      } else {
        setError(result.error);
        // Fallback to basic list
        const listResult = await SubscriptionService.getClientSubscriptions();
        if (listResult.success) {
          const items = Array.isArray(listResult.data) ? listResult.data : [];
          setSubscriptions(items);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = filter === 'All'
    ? subscriptions
    : subscriptions.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="client-subs-page">
        <div className="client-subs-container">
          <div className="client-subs__loading">Loading subscriptions…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-subs-page">
      <div className="client-subs-container">
        <h1 className="client-subs__title">My Subscriptions</h1>

        {/* Summary Cards */}
        {summary && (
          <div className="client-subs__summary">
            <div className="client-subs__stat-card">
              <span className="client-subs__stat-label">Active</span>
              <span className="client-subs__stat-value">{summary.totalActive || 0}</span>
            </div>
            <div className="client-subs__stat-card">
              <span className="client-subs__stat-label">Monthly Spend</span>
              <span className="client-subs__stat-value">₦{(summary.totalMonthlySpend || 0).toLocaleString()}</span>
            </div>
            <div className="client-subs__stat-card">
              <span className="client-subs__stat-label">Next Payment</span>
              <span className="client-subs__stat-value">
                {summary.nextPaymentDate
                  ? new Date(summary.nextPaymentDate).toLocaleDateString()
                  : '—'}
              </span>
            </div>
            <div className="client-subs__stat-card">
              <span className="client-subs__stat-label">Next Amount</span>
              <span className="client-subs__stat-value">₦{(summary.nextPaymentAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="client-subs__filters">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`client-subs__filter-btn ${filter === s ? 'client-subs__filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'PendingCancellation' ? 'Cancelling' : s}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="client-subs__error">{error}</div>}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="client-subs__empty">
            <p>No subscriptions found{filter !== 'All' ? ` with status "${filter}"` : ''}.</p>
            <button className="client-subs__browse-btn" onClick={() => navigate('/app/client/dashboard')}>
              Browse Services
            </button>
          </div>
        ) : (
          <div className="client-subs__list">
            {filtered.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} basePath="/app/client" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSubscriptions;
