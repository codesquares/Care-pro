import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import BillingHistory from '../../../components/subscriptions/BillingHistory';
import PlanHistory from '../../../components/subscriptions/PlanHistory';
import {
  CancelSubscriptionModal,
  TerminateSubscriptionModal,
  ChangePlanModal,
  PauseSubscriptionModal,
} from '../../../components/subscriptions/SubscriptionModals';
import './SubscriptionDetail.css';

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal visibility
  const [showCancel, setShowCancel] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showPause, setShowPause] = useState(false);

  const fetchSubscription = async () => {
    setLoading(true);
    const result = await SubscriptionService.getSubscriptionById(id);
    if (result.success) {
      setSub(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubscription(); }, [id]);

  // ---- Actions ----
  const handleReactivate = async () => {
    setActionLoading(true);
    const result = await SubscriptionService.reactivateSubscription(id);
    setActionLoading(false);
    if (result.success) {
      toast.success('Subscription reactivated!');
      setSub(result.data);
    } else {
      toast.error(result.error || 'Failed to reactivate');
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    const result = await SubscriptionService.resumeSubscription(id);
    setActionLoading(false);
    if (result.success) {
      toast.success('Subscription resumed!');
      setSub(result.data);
    } else {
      toast.error(result.error || 'Failed to resume');
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setActionLoading(true);
    const redirectUrl = `${window.location.origin}/app/client/subscriptions/${id}?card_updated=true`;
    const result = await SubscriptionService.updatePaymentMethod(id, redirectUrl);
    setActionLoading(false);
    if (result.success && result.data?.authorizationLink) {
      window.location.href = result.data.authorizationLink;
    } else {
      toast.error(result.error || 'Failed to initiate card update');
    }
  };

  const onModalSuccess = (updatedData) => {
    setSub((prev) => ({ ...prev, ...updatedData }));
    fetchSubscription(); // re-fetch for full data
  };

  if (loading) {
    return (
      <div className="sub-detail-page">
        <div className="sub-detail-container">
          <div className="sub-detail__loading">Loading subscription details…</div>
        </div>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="sub-detail-page">
        <div className="sub-detail-container">
          <div className="sub-detail__error">
            {error || 'Subscription not found.'}
            <button onClick={() => navigate('/app/client/subscriptions')} className="sub-detail__back-btn">
              ← Back to Subscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardDisplay = SubscriptionService.formatCardDisplay(sub.cardBrand, sub.cardLastFour);
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—';
  const nextCharge = sub.nextChargeDate ? new Date(sub.nextChargeDate).toLocaleDateString() : '—';
  const createdAt = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—';

  return (
    <div className="sub-detail-page">
      <div className="sub-detail-container">
        {/* Back */}
        <button onClick={() => navigate('/app/client/subscriptions')} className="sub-detail__back-link">
          ← My Subscriptions
        </button>

        {/* Header */}
        <div className="sub-detail__header">
          <div>
            <h1 className="sub-detail__title">{sub.gigTitle || 'Subscription Details'}</h1>
            <p className="sub-detail__subtitle">Created {createdAt}</p>
          </div>
          <SubscriptionBadge status={sub.status} size="lg" />
        </div>

        {/* Status Banners */}
        {sub.status === 'PendingCancellation' && (
          <div className="sub-detail__banner sub-detail__banner--warn">
            Your subscription will end on <strong>{periodEnd}</strong>. You'll continue to receive service until then.
            <button onClick={handleReactivate} disabled={actionLoading} className="sub-detail__banner-btn">
              {actionLoading ? 'Reactivating…' : 'Reactivate'}
            </button>
          </div>
        )}

        {sub.status === 'Suspended' && (
          <div className="sub-detail__banner sub-detail__banner--error">
            Your subscription is suspended due to payment failure. Update your payment method to continue service.
            <button onClick={handleUpdatePaymentMethod} disabled={actionLoading} className="sub-detail__banner-btn sub-detail__banner-btn--white">
              {actionLoading ? 'Processing…' : 'Update Payment Method'}
            </button>
          </div>
        )}

        {sub.status === 'PastDue' && (
          <div className="sub-detail__banner sub-detail__banner--orange">
            Payment failed — we're retrying automatically.
            <button onClick={handleUpdatePaymentMethod} disabled={actionLoading} className="sub-detail__banner-btn">
              Update Card
            </button>
          </div>
        )}

        {sub.status === 'Terminated' && sub.refundAmount > 0 && (
          <div className="sub-detail__banner sub-detail__banner--info">
            A refund of ₦{sub.refundAmount.toLocaleString()} was issued.
          </div>
        )}

        {sub.status === 'Expired' && (
          <div className="sub-detail__banner sub-detail__banner--gray">
            This subscription has expired. All billing cycles are complete.
          </div>
        )}

        {sub.status === 'Charging' && (
          <div className="sub-detail__banner sub-detail__banner--info">
            A payment is currently being processed for this subscription. Actions are temporarily disabled.
          </div>
        )}

        {/* Details Grid */}
        <div className="sub-detail__grid">
          <div className="sub-detail__card">
            <h3>Plan Details</h3>
            <div className="sub-detail__row"><span>Billing Cycle</span><span>{sub.billingCycle || '—'}</span></div>
            <div className="sub-detail__row"><span>Frequency</span><span>{sub.frequencyPerWeek || 1}x per week</span></div>
            <div className="sub-detail__row"><span>Recurring Amount</span><span>₦{(sub.recurringAmount || 0).toLocaleString()}</span></div>
            <div className="sub-detail__row"><span>Service Active</span><span>{sub.isServiceActive ? 'Yes ✓' : 'No'}</span></div>
            {sub.billingCyclesCompleted != null && (
              <div className="sub-detail__row"><span>Cycles Completed</span><span>{sub.billingCyclesCompleted}</span></div>
            )}
          </div>

          <div className="sub-detail__card">
            <h3>Billing Info</h3>
            <div className="sub-detail__row"><span>Payment Method</span><span>{cardDisplay}</span></div>
            {sub.cardExpiry && (
              <div className="sub-detail__row"><span>Card Expiry</span><span>{sub.cardExpiry}</span></div>
            )}
            <div className="sub-detail__row"><span>Next Charge</span><span>{nextCharge}</span></div>
            <div className="sub-detail__row"><span>Period End</span><span>{periodEnd}</span></div>
            {sub.remainingDaysInPeriod != null && (
              <div className="sub-detail__row"><span>Remaining Days</span><span>{sub.remainingDaysInPeriod}</span></div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        {sub.priceBreakdown && (
          <div className="sub-detail__card sub-detail__card--full">
            <h3>Price Breakdown</h3>
            <div className="sub-detail__row">
              <span>Base Price</span>
              <span>₦{(sub.priceBreakdown.basePrice || 0).toLocaleString()}</span>
            </div>
            <div className="sub-detail__row">
              <span>Frequency</span>
              <span>{sub.priceBreakdown.frequencyPerWeek || 1}x per week</span>
            </div>
            <div className="sub-detail__row">
              <span>Order Fee</span>
              <span>₦{(sub.priceBreakdown.orderFee || 0).toLocaleString()}</span>
            </div>
            <div className="sub-detail__row">
              <span>Service Charge</span>
              <span>₦{(sub.priceBreakdown.serviceCharge || 0).toLocaleString()}</span>
            </div>
            <div className="sub-detail__row">
              <span>Gateway Fees</span>
              <span>₦{(sub.priceBreakdown.gatewayFees || 0).toLocaleString()}</span>
            </div>
            <div className="sub-detail__row sub-detail__row--total">
              <span>Total Amount</span>
              <span>₦{(sub.priceBreakdown.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="sub-detail__actions">
          {sub.status === 'Active' && (
            <>
              <button className="sub-detail__action-btn sub-detail__action-btn--outline" onClick={() => setShowChangePlan(true)}>
                Change Plan
              </button>
              <button className="sub-detail__action-btn sub-detail__action-btn--outline" onClick={() => setShowPause(true)}>
                Pause
              </button>
              <button className="sub-detail__action-btn sub-detail__action-btn--outline" onClick={handleUpdatePaymentMethod} disabled={actionLoading}>
                Update Card
              </button>
              <button className="sub-detail__action-btn sub-detail__action-btn--warn" onClick={() => setShowCancel(true)}>
                Cancel
              </button>
              <button className="sub-detail__action-btn sub-detail__action-btn--danger" onClick={() => setShowTerminate(true)}>
                Terminate
              </button>
            </>
          )}

          {sub.status === 'PendingCancellation' && (
            <>
              <button className="sub-detail__action-btn sub-detail__action-btn--primary" onClick={handleReactivate} disabled={actionLoading}>
                {actionLoading ? 'Reactivating…' : 'Reactivate Subscription'}
              </button>
              <button className="sub-detail__action-btn sub-detail__action-btn--danger" onClick={() => setShowTerminate(true)}>
                Terminate Now
              </button>
            </>
          )}

          {sub.status === 'Paused' && (
            <button className="sub-detail__action-btn sub-detail__action-btn--primary" onClick={handleResume} disabled={actionLoading}>
              {actionLoading ? 'Resuming…' : 'Resume Subscription'}
            </button>
          )}

          {(sub.status === 'Suspended' || sub.status === 'PastDue') && (
            <button className="sub-detail__action-btn sub-detail__action-btn--primary" onClick={handleUpdatePaymentMethod} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : 'Update Payment Method'}
            </button>
          )}
        </div>

        {/* Plan History */}
        <PlanHistory subscriptionId={id} />

        {/* Billing History */}
        <BillingHistory subscriptionId={id} />

        {/* Modals */}
        <CancelSubscriptionModal isOpen={showCancel} onClose={() => setShowCancel(false)} subscription={sub} onSuccess={onModalSuccess} />
        <TerminateSubscriptionModal isOpen={showTerminate} onClose={() => setShowTerminate(false)} subscription={sub} onSuccess={onModalSuccess} />
        <ChangePlanModal isOpen={showChangePlan} onClose={() => setShowChangePlan(false)} subscription={sub} onSuccess={onModalSuccess} />
        <PauseSubscriptionModal isOpen={showPause} onClose={() => setShowPause(false)} subscription={sub} onSuccess={onModalSuccess} />
      </div>
    </div>
  );
};

export default SubscriptionDetail;
