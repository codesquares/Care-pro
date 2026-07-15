import { useState, useEffect } from 'react';
import SubscriptionService from '../../services/subscriptionService';
import './BillingHistory.css';

const normalizeBillingStatus = (statusValue) => String(statusValue || '').trim().toLowerCase();
const isPaidBillingStatus = (statusValue) => {
  const normalized = normalizeBillingStatus(statusValue);
  return normalized === 'successful' || normalized === 'succeeded' || normalized === 'completed' || normalized === 'success';
};
const isFailedBillingStatus = (statusValue) => {
  const normalized = normalizeBillingStatus(statusValue);
  return normalized === 'failed' || normalized === 'amountmismatch' || normalized === 'expired';
};

/**
 * Shows payment attempt history for a subscription.
 * @param {{ subscriptionId: string }} props
 */
const BillingHistory = ({ subscriptionId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const result = await SubscriptionService.getBillingHistory(subscriptionId);
      if (result.success) {
        setPayments(result.data || []);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    if (subscriptionId) fetchHistory();
  }, [subscriptionId]);

  if (loading) return <div className="billing-history__loading">Loading billing history…</div>;
  if (error) return <div className="billing-history__error">Failed to load billing history.</div>;
  if (payments.length === 0) return <div className="billing-history__empty">No payment records yet.</div>;

  return (
    <div className="billing-history">
      <h3 className="billing-history__title">Billing History</h3>
      <div className="billing-history__table-wrap">
        <table className="billing-history__table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cycle #</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, idx) => {
              const normalizedStatus = normalizeBillingStatus(p.status);
              const isPaid = isPaidBillingStatus(normalizedStatus);
              const isFailed = isFailedBillingStatus(normalizedStatus);

              return (
                <tr key={p.id || idx} className={isFailed ? 'billing-row--failed' : ''}>
                  <td>{p.attemptedAt ? new Date(p.attemptedAt).toLocaleDateString() : '—'}</td>
                  <td>{p.billingCycleNumber || '—'}</td>
                  <td>₦{(p.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`billing-status billing-status--${normalizedStatus || 'unknown'}`}>
                      {isPaid ? '✓ Paid' : isFailed ? '✕ Failed' : '… Pending'}
                    </span>
                  </td>
                  <td>
                    {isFailed && p.errorMessage
                      ? <span className="billing-error-msg">{p.errorMessage}</span>
                      : p.orderId
                        ? <span className="billing-order-link">Order #{p.orderId.slice(0, 8)}</span>
                        : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingHistory;
