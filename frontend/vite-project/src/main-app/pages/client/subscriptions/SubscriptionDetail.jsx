import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import BillingHistory from '../../../components/subscriptions/BillingHistory';
import PlanHistory from '../../../components/subscriptions/PlanHistory';
import ClientOrderService from '../../../services/clientOrderService';
import api from '../../../services/api';
import {
  CancelSubscriptionModal,
  TerminateSubscriptionModal,
  ChangePlanModal,
  PauseSubscriptionModal,
} from '../../../components/subscriptions/SubscriptionModals';
import './SubscriptionDetail.css';

const RENEWAL_POLL_INTERVAL_MS = 7000;
const RENEWAL_POLL_TIMEOUT_MS = 180000;

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const renewalReturn = searchParams.get('renewalReturn');

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractExpanded, setContractExpanded] = useState(false);

  // Linked orders for this subscription
  const [linkedOrders, setLinkedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  // Modal visibility
  const [showCancel, setShowCancel] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showPause, setShowPause] = useState(false);

  // Client-initiated renewal state
  const [renewalStatus, setRenewalStatus] = useState(null);
  const [renewalChecking, setRenewalChecking] = useState(false);
  const [renewalPolling, setRenewalPolling] = useState(false);
  const renewalPollTimerRef = useRef(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    const result = await SubscriptionService.getSubscriptionById(id);
    if (result.success) {
      setSub(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const clearRenewalPollTimer = useCallback(() => {
    if (renewalPollTimerRef.current) {
      clearTimeout(renewalPollTimerRef.current);
      renewalPollTimerRef.current = null;
    }
    setRenewalPolling(false);
  }, []);

  const fetchRenewalStatus = useCallback(async (showErrorToast = false) => {
    setRenewalChecking(true);
    const result = await SubscriptionService.getRenewalStatus(id);
    setRenewalChecking(false);

    if (result.success && result.data) {
      setRenewalStatus(result.data);
      return { success: true, data: result.data };
    }

    if (showErrorToast) {
      toast.error(result.error || 'Unable to fetch renewal status right now.');
    }
    return { success: false, data: null };
  }, [id]);

  const startRenewalPolling = useCallback(() => {
    if (renewalPollTimerRef.current) return;

    setRenewalPolling(true);
    const startedAt = Date.now();

    const poll = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= RENEWAL_POLL_TIMEOUT_MS) {
        clearRenewalPollTimer();
        toast.info('Renewal is still processing. Please refresh status shortly.');
        return;
      }

      const statusResult = await fetchRenewalStatus(false);
      const state = statusResult.data?.renewalState;

      if (statusResult.success && (state === 'paid' || state === 'failed')) {
        clearRenewalPollTimer();
        await fetchSubscription();
        if (state === 'paid') {
          toast.success('Renewal payment completed successfully.');
        }
        return;
      }

      renewalPollTimerRef.current = setTimeout(poll, RENEWAL_POLL_INTERVAL_MS);
    };

    renewalPollTimerRef.current = setTimeout(poll, 0);
  }, [clearRenewalPollTimer, fetchRenewalStatus, fetchSubscription]);

  useEffect(() => () => {
    clearRenewalPollTimer();
  }, [clearRenewalPollTimer]);

  useEffect(() => {
    if (!sub) return;
    if (sub.status !== 'PastDue' && sub.status !== 'Suspended') return;
    fetchRenewalStatus(false);
  }, [sub, fetchRenewalStatus]);

  useEffect(() => {
    if (renewalReturn !== '1') return;

    const initRenewalRecovery = async () => {
      const statusResult = await fetchRenewalStatus(false);
      const state = statusResult.data?.renewalState;

      if (statusResult.success && (state === 'paid' || state === 'failed')) {
        await fetchSubscription();
        return;
      }

      startRenewalPolling();
    };

    initRenewalRecovery();
  }, [renewalReturn, fetchRenewalStatus, startRenewalPolling, fetchSubscription]);

  // Fetch orders linked to this subscription
  const loadLinkedOrders = async () => {
    if (ordersExpanded) { setOrdersExpanded(false); return; }
    if (linkedOrders.length > 0) { setOrdersExpanded(true); return; }
    setOrdersLoading(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const allOrders = await ClientOrderService.getOrderHistory(userDetails.id);
      const subOrders = (allOrders || []).filter(o => o.subscriptionId === id);
      subOrders.sort((a, b) => (a.billingCycleNumber || 0) - (b.billingCycleNumber || 0));
      setLinkedOrders(subOrders);
      setOrdersExpanded(true);
    } catch (err) {
      console.error('Failed to load linked orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

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
    const redirectUrl = `${window.location.origin}/subscription/payment-confirmed?subscriptionId=${id}`;
    const result = await SubscriptionService.updatePaymentMethod(id, redirectUrl);
    setActionLoading(false);
    if (result.success && result.data?.authorizationLink) {
      window.location.href = result.data.authorizationLink;
    } else {
      toast.error(result.error || 'Failed to initiate card update');
    }
  };

  const handleContinueRenewalAuthorization = async () => {
    const authorizationUrl = renewalStatus?.latestPaymentAttempt?.authorizationUrl;
    if (authorizationUrl) {
      window.location.href = authorizationUrl;
      return;
    }

    toast.info('Authorization is still being prepared. Checking renewal status...');
    startRenewalPolling();
  };

  const handleRenewSubscription = async () => {
    setActionLoading(true);
    const redirectUrl = `${window.location.origin}/app/client/subscriptions/${id}?renewalReturn=1`;
    const result = await SubscriptionService.renewSubscription(id, redirectUrl);
    setActionLoading(false);

    const payload = result.data || null;
    const nextAction = payload?.nextAction;
    const outcome = payload?.outcome;
    const normalizedOutcome = String(outcome || '').trim().toLowerCase();
    const isRenewalSuccessOutcome =
      normalizedOutcome === 'success' ||
      normalizedOutcome === 'successful' ||
      normalizedOutcome === 'succeeded' ||
      normalizedOutcome === 'completed';
    const authorizationUrl = payload?.latestPaymentAttempt?.authorizationUrl;
    const failureReason = String(payload?.message || result.error || '').toLowerCase();
    const isTokenOrEmailMismatch = failureReason.includes('wrong token or email passed');

    if (!result.success) {
      if (nextAction === 'retry_or_update_payment_method') {
        if (isTokenOrEmailMismatch) {
          toast.error('Your saved payment method is no longer valid. Update your payment method, then retry payment.');
        } else {
          toast.error(payload?.message || result.error || 'Renewal failed. Retry or update card details.');
        }
      } else {
        toast.error(result.error || payload?.message || 'Failed to trigger renewal.');
      }
      await fetchRenewalStatus(false);
      return;
    }

    if (isRenewalSuccessOutcome || nextAction === 'refresh_subscription') {
      toast.success(payload?.message || 'Renewal payment processed successfully.');
      await fetchSubscription();
      await fetchRenewalStatus(false);
      return;
    }

    if (outcome === 'action_required' || nextAction === 'complete_authorization') {
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
        return;
      }

      toast.info(payload?.message || 'Payment authorization is pending. Checking status...');
      await fetchRenewalStatus(false);
      startRenewalPolling();
      return;
    }

    if (nextAction === 'retry_or_update_payment_method') {
      toast.error(payload?.message || 'Renewal failed. Retry payment or update card details.');
      await fetchRenewalStatus(false);
      return;
    }

    toast.info('Checking renewal status...');
    await fetchRenewalStatus(false);
    startRenewalPolling();
  };

  const onModalSuccess = (updatedData) => {
    setSub((prev) => ({ ...prev, ...updatedData }));
    fetchSubscription(); // re-fetch for full data
  };

  const loadContract = async () => {
    if (contractExpanded) { setContractExpanded(false); return; }
    if (contract) { setContractExpanded(true); return; }
    setContractLoading(true);
    try {
      const res = await api.get(`/contracts/${sub.contractId}`);
      setContract(res.data?.data ?? res.data);
      setContractExpanded(true);
    } catch (err) {
      console.error('Failed to load contract:', err);
    } finally {
      setContractLoading(false);
    }
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
  const renewalState = renewalStatus?.renewalState || 'none';
  const renewalNextAction = renewalStatus?.nextAction || 'none';
  const renewalErrorMessage = String(renewalStatus?.latestPaymentAttempt?.errorMessage || '').toLowerCase();
  const shouldPrioritizeUpdatePayment =
    renewalNextAction === 'update_payment_method' ||
    renewalNextAction === 'retry_or_update_payment_method' ||
    renewalErrorMessage.includes('wrong token or email passed');
  const showRenewalActions = sub.status === 'Suspended' || sub.status === 'PastDue' || renewalState === 'action_required';
  const renewalBusy = actionLoading || renewalChecking || renewalPolling;

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

        {sub.status === 'Terminated' && (
          <div className="sub-detail__banner sub-detail__banner--info">
            Subscription billing has been terminated. Termination does not automatically issue a refund.
            <div style={{ marginTop: '8px' }}>
              If you need immediate refund handling for undelivered service, cancel the current order.
            </div>
            {sub.originalOrderId && (
              <button
                onClick={() => navigate(`/app/client/my-order/${sub.originalOrderId}`)}
                className="sub-detail__banner-btn"
                style={{ marginTop: '10px' }}
              >
                Open Current Order
              </button>
            )}
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

        {showRenewalActions && renewalStatus && (
          <div className="sub-detail__banner sub-detail__banner--info">
            <strong>Renewal Status:</strong> {renewalState}
            <span>Next action: {renewalNextAction}</span>
            {renewalStatus.failedChargeAttempts != null && (
              <span>Failed attempts: {renewalStatus.failedChargeAttempts}</span>
            )}
            {shouldPrioritizeUpdatePayment && (
              <span>Your payment method may be invalid. Update payment method before retrying.</span>
            )}
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
            <>
              {renewalState === 'action_required' && (
                <button className="sub-detail__action-btn sub-detail__action-btn--primary" onClick={handleContinueRenewalAuthorization} disabled={renewalBusy}>
                  {renewalBusy ? 'Processing…' : 'Continue Payment'}
                </button>
              )}
              <button
                className={`sub-detail__action-btn ${shouldPrioritizeUpdatePayment ? 'sub-detail__action-btn--primary' : 'sub-detail__action-btn--outline'}`}
                onClick={handleUpdatePaymentMethod}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing…' : shouldPrioritizeUpdatePayment ? 'Update Payment Method (Recommended)' : 'Update Payment Method'}
              </button>
              <button
                className={`sub-detail__action-btn ${shouldPrioritizeUpdatePayment ? 'sub-detail__action-btn--outline' : 'sub-detail__action-btn--primary'}`}
                onClick={handleRenewSubscription}
                disabled={renewalBusy}
              >
                {renewalBusy ? 'Processing…' : shouldPrioritizeUpdatePayment ? 'Retry Payment (After Update)' : 'Retry Payment'}
              </button>
            </>
          )}
        </div>

        {/* Plan History */}
        <PlanHistory subscriptionId={id} />

        {/* Billing History */}
        <BillingHistory subscriptionId={id} />

        {/* Linked Orders by Cycle */}
        <div className="sub-detail__card sub-detail__card--full">
          <div className="sub-detail__contract-header">
            <h3>Order Cycles</h3>
            <button
              className="sub-detail__view-contract-btn"
              onClick={loadLinkedOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? 'Loading…' : ordersExpanded ? 'Hide Orders ▲' : 'View Orders ▼'}
            </button>
          </div>
          {ordersExpanded && linkedOrders.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {linkedOrders.map((order) => {
                const fundInfo = ClientOrderService.getFundStatusInfo(order);
                const colorMap = {
                  'fund-status--released': '#2e7d32',
                  'fund-status--auto-released': '#1565c0',
                  'fund-status--pending': '#e65100',
                  'fund-status--disputed': '#c62828',
                };
                return (
                  <div key={order.id} className="sub-detail__row" style={{ alignItems: 'center' }}>
                    <span>Cycle {order.billingCycleNumber || '—'}</span>
                    <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span>₦{(order.amount || 0).toLocaleString()}</span>
                      <span style={{ fontWeight: 600, fontSize: '12px', color: order.clientOrderStatus === 'Completed' ? '#2e7d32' : '#e67e22' }}>
                        {order.clientOrderStatus}
                      </span>
                      {fundInfo.label && (
                        <span style={{ fontWeight: 600, fontSize: '11px', color: colorMap[fundInfo.className] || '#888' }}>
                          {fundInfo.label}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {ordersExpanded && linkedOrders.length === 0 && (
            <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>No orders found for this subscription.</p>
          )}
        </div>

        {/* Contract */}
        {sub.contractId && (
          <div className="sub-detail__card sub-detail__card--full">
            <div className="sub-detail__contract-header">
              <h3>Service Contract</h3>
              <button
                className="sub-detail__view-contract-btn"
                onClick={loadContract}
                disabled={contractLoading}
              >
                {contractLoading ? 'Loading…' : contractExpanded ? 'Hide Contract ▲' : 'View Contract ▼'}
              </button>
            </div>
            {contractExpanded && contract && (
              <>
                <div className="sub-detail__row"><span>Status</span><span>{contract.status || '—'}</span></div>
                <div className="sub-detail__row"><span>Service Address</span><span>{contract.serviceAddress || '—'}</span></div>
                {contract.contractStartDate && (
                  <div className="sub-detail__row"><span>Start Date</span><span>{new Date(contract.contractStartDate).toLocaleDateString()}</span></div>
                )}
                {contract.contractEndDate && (
                  <div className="sub-detail__row"><span>End Date</span><span>{new Date(contract.contractEndDate).toLocaleDateString()}</span></div>
                )}
                {contract.schedule?.length > 0 && (
                  <div className="sub-detail__row"><span>Scheduled Visits</span><span>{contract.schedule.length} visit(s) per week</span></div>
                )}
                {contract.specialClientRequirements && (
                  <div className="sub-detail__row"><span>Special Requirements</span><span>{contract.specialClientRequirements}</span></div>
                )}
              </>
            )}
          </div>
        )}

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
