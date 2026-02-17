import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import SubscriptionService from '../../services/subscriptionService';
import './SubscriptionModals.css';

/**
 * Cancel Subscription Modal — graceful cancellation at period end.
 */
export const CancelSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : 'the end of the current period';

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    const result = await SubscriptionService.cancelSubscription(subscription.id, reason);
    setLoading(false);
    if (result.success) {
      toast.success('Subscription scheduled for cancellation.');
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.error);
    }
  };

  return createPortal(
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal__header">
          <h3>Cancel Subscription</h3>
          <button className="sub-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sub-modal__body">
          <p className="sub-modal__info">
            Your service will continue until <strong>{periodEnd}</strong>. After that, no further charges will be made.
          </p>
          <label className="sub-modal__label">Reason for cancellation (optional)</label>
          <textarea
            className="sub-modal__textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you cancelling?"
            rows={3}
          />
          {error && <p className="sub-modal__error">{error}</p>}
        </div>
        <div className="sub-modal__footer">
          <button className="sub-modal__btn sub-modal__btn--secondary" onClick={onClose} disabled={loading}>
            Keep Subscription
          </button>
          <button className="sub-modal__btn sub-modal__btn--danger" onClick={handleCancel} disabled={loading}>
            {loading ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Terminate Subscription Modal — immediate stop.
 */
export const TerminateSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [issueRefund, setIssueRefund] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const estimatedRefund = subscription
    ? SubscriptionService.estimateProRatedRefund(
        subscription.remainingDaysInPeriod || 0,
        subscription.recurringAmount || 0,
        subscription.billingCycle
      )
    : 0;

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);
    const result = await SubscriptionService.terminateSubscription(subscription.id, reason, issueRefund);
    setLoading(false);
    if (result.success) {
      const refundMsg = result.data?.refundAmount
        ? ` Refund of ₦${result.data.refundAmount.toLocaleString()} issued.`
        : '';
      toast.success(`Subscription terminated.${refundMsg}`);
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.error);
    }
  };

  return createPortal(
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal__header">
          <h3>Terminate Subscription</h3>
          <button className="sub-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sub-modal__body">
          <div className="sub-modal__warning">
            ⚠️ This will end your service immediately. This action cannot be undone.
          </div>
          {issueRefund && estimatedRefund > 0 && (
            <p className="sub-modal__info">
              You'll receive a refund of approximately <strong>₦{estimatedRefund.toLocaleString()}</strong> for the{' '}
              {subscription.remainingDaysInPeriod || 0} unused days.
            </p>
          )}
          <label className="sub-modal__label">Reason for termination</label>
          <textarea
            className="sub-modal__textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you terminating?"
            rows={3}
          />
          <label className="sub-modal__checkbox-label">
            <input
              type="checkbox"
              checked={issueRefund}
              onChange={(e) => setIssueRefund(e.target.checked)}
            />
            Issue pro-rated refund for unused days
          </label>
          {error && <p className="sub-modal__error">{error}</p>}
        </div>
        <div className="sub-modal__footer">
          <button className="sub-modal__btn sub-modal__btn--secondary" onClick={onClose} disabled={loading}>
            Go Back
          </button>
          <button className="sub-modal__btn sub-modal__btn--danger" onClick={handleTerminate} disabled={loading}>
            {loading ? 'Terminating…' : 'Terminate Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Change Plan Modal — billing cycle & frequency.
 */
export const ChangePlanModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [billingCycle, setBillingCycle] = useState(subscription?.billingCycle || 'weekly');
  const [frequency, setFrequency] = useState(subscription?.frequencyPerWeek || 1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = async () => {
    setLoading(true);
    setError(null);
    const planData = {};
    if (billingCycle !== subscription.billingCycle) planData.newBillingCycle = billingCycle;
    if (frequency !== subscription.frequencyPerWeek) planData.newFrequencyPerWeek = frequency;

    if (Object.keys(planData).length === 0) {
      setError('No changes selected.');
      setLoading(false);
      return;
    }

    const res = await SubscriptionService.changePlan(subscription.id, planData);
    setLoading(false);
    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  };

  return createPortal(
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal__header">
          <h3>Change Plan</h3>
          <button className="sub-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sub-modal__body">
          {result ? (
            <div className="sub-modal__success">
              <p>
                Your plan will change from{' '}
                <strong>₦{(result.currentAmount || 0).toLocaleString()}/{subscription.billingCycle}</strong> to{' '}
                <strong>₦{(result.newAmount || 0).toLocaleString()}/{billingCycle}</strong>{' '}
                starting <strong>{result.effectiveDate ? new Date(result.effectiveDate).toLocaleDateString() : 'next billing cycle'}</strong>.
              </p>
              <p className="sub-modal__change-type">
                {result.changeType === 'upgrade' ? '⬆️ Upgrade' : '⬇️ Downgrade'}
              </p>
              <button
                className="sub-modal__btn sub-modal__btn--primary"
                onClick={() => { onSuccess(result); onClose(); }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <label className="sub-modal__label">Billing Cycle</label>
              <div className="sub-modal__toggle-group">
                <button
                  className={`sub-modal__toggle ${billingCycle === 'weekly' ? 'sub-modal__toggle--active' : ''}`}
                  onClick={() => setBillingCycle('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`sub-modal__toggle ${billingCycle === 'monthly' ? 'sub-modal__toggle--active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
              </div>

              <label className="sub-modal__label">
                Sessions Per Week: <strong>{frequency}</strong>
              </label>
              <input
                type="range"
                min={1}
                max={7}
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="sub-modal__range"
              />
              <div className="sub-modal__range-labels">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
              </div>

              {error && <p className="sub-modal__error">{error}</p>}
            </>
          )}
        </div>
        {!result && (
          <div className="sub-modal__footer">
            <button className="sub-modal__btn sub-modal__btn--secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="sub-modal__btn sub-modal__btn--primary" onClick={handleChange} disabled={loading}>
              {loading ? 'Updating…' : 'Change Plan'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * Pause Subscription Modal.
 */
export const PauseSubscriptionModal = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handlePause = async () => {
    setLoading(true);
    setError(null);
    const result = await SubscriptionService.pauseSubscription(
      subscription.id,
      reason,
      resumeDate || null
    );
    setLoading(false);
    if (result.success) {
      toast.success('Subscription paused.');
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.error);
    }
  };

  return createPortal(
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal__header">
          <h3>Pause Subscription</h3>
          <button className="sub-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sub-modal__body">
          <p className="sub-modal__info">
            No charges will be made while your subscription is paused. You can resume anytime.
          </p>
          <label className="sub-modal__label">Reason (optional)</label>
          <textarea
            className="sub-modal__textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Traveling"
            rows={2}
          />
          <label className="sub-modal__label">Auto-resume date (optional)</label>
          <input
            type="date"
            className="sub-modal__input"
            value={resumeDate}
            onChange={(e) => setResumeDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          {error && <p className="sub-modal__error">{error}</p>}
        </div>
        <div className="sub-modal__footer">
          <button className="sub-modal__btn sub-modal__btn--secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="sub-modal__btn sub-modal__btn--primary" onClick={handlePause} disabled={loading}>
            {loading ? 'Pausing…' : 'Pause Subscription'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
