import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import './SubscriptionPaymentConfirmed.css';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60000;

const stateLabel = {
  none: 'No active card-update attempt',
  pending: 'Processing your card update',
  completed: 'Card update completed',
  failed: 'Card update failed',
  expired: 'Card update expired',
};

const SubscriptionPaymentConfirmed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subscriptionId = searchParams.get('subscriptionId');

  const [statusData, setStatusData] = useState(null);
  const [viewState, setViewState] = useState('processing');
  const [message, setMessage] = useState('Processing your card update, please wait...');
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const timeoutRef = useRef(null);
  const cancelledRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const checkStatus = useCallback(async () => {
    if (!subscriptionId) {
      setViewState('invalid');
      setMessage('Missing subscription reference. Please return to subscriptions.');
      return { terminal: true };
    }

    const result = await SubscriptionService.getPaymentMethodStatus(subscriptionId);
    if (!result?.success || !result?.data) {
      setMessage(result?.error || 'Unable to confirm card update status yet.');
      return { terminal: false };
    }

    const data = result.data;
    setStatusData(data);

    if (data.cardUpdateState === 'completed') {
      setViewState('completed');
      setMessage('Your card update is complete.');
      // Confirm the subscription can now be fetched with updated details.
      await SubscriptionService.getSubscriptionById(subscriptionId);
      return { terminal: true };
    }

    if (data.cardUpdateState === 'failed' || data.cardUpdateState === 'expired') {
      setViewState('failed');
      setMessage(data.failureReason || 'We could not complete your card update. Please try again.');
      return { terminal: true };
    }

    if (data.cardUpdateState === 'none') {
      setViewState('failed');
      setMessage('No active card-update attempt was found. Please retry from your subscription page.');
      return { terminal: true };
    }

    setViewState('processing');
    setMessage('Processing your card update, please wait...');
    return { terminal: false };
  }, [subscriptionId]);

  useEffect(() => {
    cancelledRef.current = false;
    clearTimer();

    if (!subscriptionId) {
      setViewState('invalid');
      setMessage('Missing subscription reference. Please return to subscriptions.');
      return () => {
        cancelledRef.current = true;
        clearTimer();
      };
    }

    const startedAt = Date.now();

    const poll = async () => {
      if (cancelledRef.current) return;

      const { terminal } = await checkStatus();
      if (cancelledRef.current || terminal) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setViewState('timeout');
        setMessage('Still processing in the background. You can refresh status shortly.');
        return;
      }

      timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelledRef.current = true;
      clearTimer();
    };
  }, [checkStatus, subscriptionId]);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    const { terminal } = await checkStatus();
    if (!terminal && viewState !== 'processing') {
      setViewState('timeout');
      setMessage('Still processing in the background. Please try again in a moment.');
    }
    setManualRefreshing(false);
  };

  const detailPath = useMemo(() => (
    subscriptionId ? `/app/client/subscriptions/${subscriptionId}` : '/app/client/subscriptions'
  ), [subscriptionId]);

  return (
    <div className="sub-pay-confirm-page">
      <div className="sub-pay-confirm-card">
        <h1>Subscription Payment Confirmation</h1>
        <p className="sub-pay-confirm-message">{message}</p>

        {statusData && (
          <div className="sub-pay-confirm-meta">
            <div><span>State</span><strong>{stateLabel[statusData.cardUpdateState] || statusData.cardUpdateState}</strong></div>
            <div><span>Next Action</span><strong>{statusData.nextAction || 'none'}</strong></div>
            {statusData.pendingTxRef && (
              <div><span>Reference</span><strong>{statusData.pendingTxRef}</strong></div>
            )}
            {statusData.startedAt && (
              <div><span>Started</span><strong>{new Date(statusData.startedAt).toLocaleString()}</strong></div>
            )}
            {statusData.completedAt && (
              <div><span>Completed</span><strong>{new Date(statusData.completedAt).toLocaleString()}</strong></div>
            )}
            {statusData.failureReason && (
              <div><span>Reason</span><strong>{statusData.failureReason}</strong></div>
            )}
          </div>
        )}

        <div className="sub-pay-confirm-actions">
          {(viewState === 'timeout' || viewState === 'processing') && (
            <button onClick={handleManualRefresh} disabled={manualRefreshing}>
              {manualRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          )}

          {(viewState === 'completed' || viewState === 'failed' || viewState === 'invalid' || viewState === 'timeout') && (
            <button className="sub-pay-confirm-primary" onClick={() => navigate(detailPath)}>
              View Subscription
            </button>
          )}

          {(viewState === 'failed' || viewState === 'invalid') && (
            <button onClick={() => navigate('/app/client/subscriptions')}>
              Back to Subscriptions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentConfirmed;
