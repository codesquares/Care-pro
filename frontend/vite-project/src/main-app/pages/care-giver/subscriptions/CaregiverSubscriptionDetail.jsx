import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import BillingHistory from '../../../components/subscriptions/BillingHistory';
import './CaregiverSubscriptionDetail.css';

/**
 * Read-only subscription detail view for caregivers.
 */
const CaregiverSubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await SubscriptionService.getSubscriptionById(id);
      if (result.success) {
        setSub(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="cg-sub-detail-page">
        <div className="cg-sub-detail-container">
          <p className="cg-sub-detail__loading">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="cg-sub-detail-page">
        <div className="cg-sub-detail-container">
          <p className="cg-sub-detail__error">{error || 'Not found.'}</p>
          <button onClick={() => navigate('/app/caregiver/subscriptions')} className="cg-sub-detail__back-btn">← Back</button>
        </div>
      </div>
    );
  }

  const nextCharge = sub.nextChargeDate ? new Date(sub.nextChargeDate).toLocaleDateString() : '—';
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—';

  return (
    <div className="cg-sub-detail-page">
      <div className="cg-sub-detail-container">
        <button onClick={() => navigate('/app/caregiver/subscriptions')} className="cg-sub-detail__back-link">
          ← Client Subscriptions
        </button>

        <div className="cg-sub-detail__header">
          <div>
            <h1 className="cg-sub-detail__title">{sub.gigTitle || 'Subscription'}</h1>
            <p className="cg-sub-detail__subtitle">
              {sub.clientName ? `Client: ${sub.clientName}` : ''}
            </p>
          </div>
          <SubscriptionBadge status={sub.status} size="lg" />
        </div>

        <div className="cg-sub-detail__grid">
          <div className="cg-sub-detail__card">
            <h3>Plan</h3>
            <div className="cg-sub-detail__row"><span>Billing Cycle</span><span>{sub.billingCycle || '—'}</span></div>
            <div className="cg-sub-detail__row"><span>Frequency</span><span>{sub.frequencyPerWeek || 1}x/week</span></div>
            <div className="cg-sub-detail__row"><span>Amount</span><span>₦{(sub.recurringAmount || 0).toLocaleString()}</span></div>
            <div className="cg-sub-detail__row"><span>Service Active</span><span>{sub.isServiceActive ? 'Yes ✓' : 'No'}</span></div>
          </div>
          <div className="cg-sub-detail__card">
            <h3>Schedule</h3>
            <div className="cg-sub-detail__row"><span>Next Charge</span><span>{nextCharge}</span></div>
            <div className="cg-sub-detail__row"><span>Period End</span><span>{periodEnd}</span></div>
          </div>
        </div>

        <BillingHistory subscriptionId={id} />
      </div>
    </div>
  );
};

export default CaregiverSubscriptionDetail;
