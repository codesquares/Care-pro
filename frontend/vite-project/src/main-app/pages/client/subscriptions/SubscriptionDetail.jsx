import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PackageSubscriptionService, { formatNaira, formatDate, billingNote, isStopped } from '../../../services/packageSubscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import './SubscriptionDetail.css';

const PAYMENT_LABELS = {
  successful: 'Paid',
  failed: 'Failed',
  pending: 'Awaiting authorisation',
  verification_failed: 'Failed',
  amount_mismatch: 'Failed',
};

const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await PackageSubscriptionService.get(id);
    if (result.success) {
      setSub(result.data);
    } else {
      setError(result.error || 'Subscription not found.');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    setBusy(true);
    const result = await PackageSubscriptionService.cancel(id, reason.trim());
    setBusy(false);
    if (result.success) {
      toast.success('Auto-renewal stopped. You will not be charged again.');
      setSub(result.data);
      setConfirming(false);
    } else {
      toast.error(result.error || 'Could not cancel. Please try again.');
    }
  };

  if (loading) {
    return <div className="sub-detail-page"><div className="sub-detail-container"><div className="sub-detail__loading">Loading…</div></div></div>;
  }

  if (error || !sub) {
    return (
      <div className="sub-detail-page">
        <div className="sub-detail-container">
          <div className="sub-detail__error" role="alert">{error || 'Subscription not found.'}</div>
          <button className="sub-detail__back-btn" onClick={() => navigate('/app/client/subscriptions')}>Back to subscriptions</button>
        </div>
      </div>
    );
  }

  const note = billingNote(sub);
  const stopped = isStopped(sub.status);

  return (
    <div className="sub-detail-page">
      <div className="sub-detail-container">
        <button className="sub-detail__back-link" onClick={() => navigate('/app/client/subscriptions')}>← My subscriptions</button>

        <div className="sub-detail__header">
          <div>
            <h1 className="sub-detail__title">{sub.packageCategory || 'Care package'}</h1>
            {sub.packageTierLabel && <p className="sub-detail__subtitle">{sub.packageTierLabel}</p>}
          </div>
          <SubscriptionBadge status={sub.status} size="lg" />
        </div>

        <div className={`pkg-sub-note pkg-sub-note--${note.tone}`}>{note.text}</div>

        <section className="sub-detail__section">
          <h2 className="sub-detail__section-title">What you pay each month</h2>
          <dl className="sub-detail__grid">
            <div><dt>Package price</dt><dd>{formatNaira(sub.baseAmount)}</dd></div>
            <div><dt>Card processing fee</dt><dd>{formatNaira(sub.gatewayFee)}</dd></div>
            <div className="sub-detail__total"><dt>Charged each renewal</dt><dd>{formatNaira(sub.recurringAmount)}</dd></div>
          </dl>
        </section>

        <section className="sub-detail__section">
          <h2 className="sub-detail__section-title">Billing</h2>
          <dl className="sub-detail__grid">
            <div><dt>Current period</dt><dd>{formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</dd></div>
            <div><dt>Next charge</dt><dd>{sub.nextChargeDate ? formatDate(sub.nextChargeDate) : '—'}</dd></div>
            <div><dt>Renewals completed</dt><dd>{sub.billingCyclesCompleted}</dd></div>
            <div><dt>Payment method</dt><dd>{sub.hasSavedCard ? `${sub.cardBrand || 'Card'} •••• ${sub.cardLastFour || ''}${sub.cardExpiry ? ` (exp ${sub.cardExpiry})` : ''}` : 'No card saved'}</dd></div>
          </dl>
          {sub.lastChargeError && sub.failedChargeAttempts > 0 && (
            <p className="sub-detail__fail">Last payment problem: {sub.lastChargeError}</p>
          )}
        </section>

        <section className="sub-detail__section">
          <h2 className="sub-detail__section-title">Payment history</h2>
          {sub.payments && sub.payments.length > 0 ? (
            <table className="sub-detail__table">
              <thead><tr><th>Date</th><th>Renewal</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {sub.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.attemptedAt)}</td>
                    <td>#{p.billingCycleNumber}</td>
                    <td>{formatNaira(p.amount)}</td>
                    <td>{PAYMENT_LABELS[p.status] || p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="sub-detail__muted">No renewals yet. Your first payment was taken when you paid for this package.</p>
          )}
        </section>

        {!stopped && (
          <section className="sub-detail__section">
            <h2 className="sub-detail__section-title">Stop auto-renewal</h2>
            {!confirming ? (
              <>
                <p className="sub-detail__muted">
                  You will not be charged again. Care already paid for continues until {formatDate(sub.currentPeriodEnd)}.
                </p>
                <button className="sub-detail__danger-btn" onClick={() => setConfirming(true)}>Cancel auto-renewal</button>
              </>
            ) : (
              <div className="sub-detail__confirm">
                <label htmlFor="cancel-reason">Reason (optional)</label>
                <textarea id="cancel-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="sub-detail__confirm-actions">
                  <button className="sub-detail__danger-btn" onClick={handleCancel} disabled={busy}>
                    {busy ? 'Stopping…' : 'Yes, stop auto-renewal'}
                  </button>
                  <button className="sub-detail__ghost-btn" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button>
                </div>
              </div>
            )}
          </section>
        )}

        <button className="sub-detail__ghost-btn" onClick={() => navigate(`/app/client/requests/${sub.packageRequestId}`)}>
          View the package request
        </button>
      </div>
    </div>
  );
};

export default SubscriptionDetail;
