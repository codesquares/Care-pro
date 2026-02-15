import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import './SubscriptionAdmin.css';

const STATUS_OPTIONS = ['All', 'Active', 'PendingCancellation', 'PastDue', 'Suspended', 'Paused', 'Cancelled', 'Terminated'];

const SubscriptionAdmin = () => {
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [terminatingId, setTerminatingId] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const result = await SubscriptionService.getAdminAnalytics();
      if (result.success) {
        setAnalytics(result.data);
      }
      // Also fetch all subscriptions
      const listResult = await SubscriptionService.getAdminSubscriptions(null);
      if (listResult.success) {
        const items = Array.isArray(listResult.data) ? listResult.data : listResult.data?.subscriptions || listResult.data?.items || [];
        setSubscriptions(items);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const handleFilterChange = async (status) => {
    setStatusFilter(status);
    setListLoading(true);
    const result = await SubscriptionService.getAdminSubscriptions(status === 'All' ? null : status);
    if (result.success) {
      const items = Array.isArray(result.data) ? result.data : result.data?.subscriptions || result.data?.items || [];
      setSubscriptions(items);
    }
    setListLoading(false);
  };

  const handleTerminate = async (subId) => {
    if (!window.confirm('Are you sure you want to terminate this subscription?')) return;
    setTerminatingId(subId);
    const result = await SubscriptionService.adminTerminateSubscription(subId);
    setTerminatingId(null);
    if (result.success) {
      toast.success('Subscription terminated');
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? { ...s, status: 'Terminated' } : s)));
    } else {
      toast.error(result.error || 'Failed to terminate');
    }
  };

  if (loading) {
    return (
      <div className="sub-admin-page">
        <div className="sub-admin-container">
          <div className="sub-admin__loading">Loading subscription analytics…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sub-admin-page">
      <div className="sub-admin-container">
        <h1 className="sub-admin__title">Subscription Management</h1>

        {/* Analytics cards */}
        {analytics && (
          <div className="sub-admin__analytics">
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">Active</span>
              <span className="sub-admin__metric-value">{analytics.totalActive || 0}</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">Past Due</span>
              <span className="sub-admin__metric-value sub-admin__metric-value--orange">{analytics.totalPastDue || 0}</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">Suspended</span>
              <span className="sub-admin__metric-value sub-admin__metric-value--red">{analytics.totalSuspended || 0}</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">Cancelled</span>
              <span className="sub-admin__metric-value">{analytics.totalCancelled || 0}</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">MRR</span>
              <span className="sub-admin__metric-value">₦{(analytics.mrr || 0).toLocaleString()}</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">Churn Rate</span>
              <span className="sub-admin__metric-value">{(analytics.churnRate || 0).toFixed(1)}%</span>
            </div>
            <div className="sub-admin__metric">
              <span className="sub-admin__metric-label">New This Month</span>
              <span className="sub-admin__metric-value">{analytics.newThisMonth || 0}</span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="sub-admin__filter-bar">
          <label className="sub-admin__filter-label">Filter by status:</label>
          <select
            className="sub-admin__filter-select"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'PendingCancellation' ? 'Cancelling' : s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {listLoading ? (
          <p className="sub-admin__loading">Loading…</p>
        ) : subscriptions.length === 0 ? (
          <p className="sub-admin__empty">No subscriptions found.</p>
        ) : (
          <div className="sub-admin__table-wrap">
            <table className="sub-admin__table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Gig</th>
                  <th>Cycle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Next Charge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.clientName || s.clientEmail || '—'}</td>
                    <td>{s.gigTitle || '—'}</td>
                    <td>{s.billingCycle || '—'}</td>
                    <td>₦{(s.recurringAmount || 0).toLocaleString()}</td>
                    <td><SubscriptionBadge status={s.status} size="sm" /></td>
                    <td>{s.nextChargeDate ? new Date(s.nextChargeDate).toLocaleDateString() : '—'}</td>
                    <td>
                      {!['Cancelled', 'Terminated'].includes(s.status) && (
                        <button
                          className="sub-admin__terminate-btn"
                          onClick={() => handleTerminate(s.id)}
                          disabled={terminatingId === s.id}
                        >
                          {terminatingId === s.id ? '…' : 'Terminate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionAdmin;
