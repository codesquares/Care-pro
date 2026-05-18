import { useState } from 'react';
import configs from '../../../config';
import './payment-resolution.css';

const getToken = () => localStorage.getItem('authToken');

const fmt = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(amount);

// ─── Resolve Panel ────────────────────────────────────────────────────────────
const ResolvePanel = () => {
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error'|'mismatch', data }
  const [mismatchPending, setMismatchPending] = useState(null); // holds the 409 payload

  const callResolve = async (forceOverride = false) => {
    if (!txId.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const url = `${configs.BASE_URL}/payments/admin/resolve/${txId.trim()}${forceOverride ? '?forceOverride=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (res.status === 409) {
        setMismatchPending(data);
        setResult({ type: 'mismatch', data });
      } else if (res.ok && data.success) {
        setMismatchPending(null);
        setResult({ type: 'success', data });
        setTxId('');
      } else {
        setMismatchPending(null);
        setResult({ type: 'error', data });
      }
    } catch (err) {
      setResult({ type: 'error', data: { message: 'Network error — could not reach the server.' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMismatchPending(null);
    callResolve(false);
  };

  const handleForceOverride = () => {
    callResolve(true);
  };

  return (
    <div className="pr-panel">
      <div className="pr-panel__header">
        <i className="fas fa-wrench pr-panel__icon pr-panel__icon--resolve" />
        <div>
          <h2 className="pr-panel__title">Resolve Stuck Payment</h2>
          <p className="pr-panel__desc">
            Use this when a payment shows as successful on the Flutterwave dashboard but is still
            pending in our system (webhook was lost or never delivered).
          </p>
        </div>
      </div>

      <form className="pr-form" onSubmit={handleSubmit}>
        <label className="pr-label" htmlFor="resolve-tx-id">
          Flutterwave Transaction ID
        </label>
        <div className="pr-input-row">
          <input
            id="resolve-tx-id"
            className="pr-input"
            type="text"
            placeholder="e.g. 3296847"
            value={txId}
            onChange={(e) => { setTxId(e.target.value); setResult(null); setMismatchPending(null); }}
            disabled={loading}
          />
          <button className="pr-btn pr-btn--resolve" type="submit" disabled={loading || !txId.trim()}>
            {loading ? <span className="pr-spinner" /> : 'Resolve'}
          </button>
        </div>
        <p className="pr-hint">
          Find the numeric transaction ID on the Flutterwave dashboard under Transactions. It is NOT the same as our internal tx_ref (CAREPRO-PAY-...).
        </p>
      </form>

      {/* AmountMismatch confirmation */}
      {result?.type === 'mismatch' && mismatchPending && (
        <div className="pr-alert pr-alert--warning">
          <i className="fas fa-exclamation-triangle" />
          <div>
            <strong>Amount Mismatch Detected</strong>
            <p>
              This payment is flagged because the amount received did not match what we expected.
            </p>
            <div className="pr-mismatch-amounts">
              <span>Amount we expected: <strong>{fmt(mismatchPending.storedAmount)}</strong></span>
              <span>Amount Flutterwave confirmed: <strong>{fmt(mismatchPending.confirmedAmount)}</strong></span>
              <span>tx_ref: <code>{mismatchPending.txRef}</code></span>
            </div>
            <p>Review the difference above, then decide whether to override.</p>
            <div className="pr-alert-actions">
              <button
                className="pr-btn pr-btn--danger"
                onClick={handleForceOverride}
                disabled={loading}
              >
                {loading ? <span className="pr-spinner" /> : 'Override & Resolve Anyway'}
              </button>
              <button
                className="pr-btn pr-btn--ghost"
                onClick={() => { setResult(null); setMismatchPending(null); setTxId(''); }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {result?.type === 'success' && (
        <div className="pr-alert pr-alert--success">
          <i className="fas fa-check-circle" />
          <div>
            <strong>Payment Resolved Successfully</strong>
            <div className="pr-result-grid">
              <span>tx_ref</span><span><code>{result.data.txRef}</code></span>
              <span>Flutterwave ID</span><span><code>{result.data.flutterwaveTransactionId}</code></span>
              <span>Confirmed Amount</span><span>{fmt(result.data.confirmedAmount)}</span>
              {result.data.orderId && <><span>Order ID</span><span><code>{result.data.orderId}</code></span></>}
              <span>Message</span><span>{result.data.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error (non-mismatch) */}
      {result?.type === 'error' && (
        <div className="pr-alert pr-alert--error">
          <i className="fas fa-times-circle" />
          <div>
            <strong>Could Not Resolve Payment</strong>
            <p>{result.data.message}</p>
            {result.data.flutterwaveStatus && (
              <p>Flutterwave status: <strong>{result.data.flutterwaveStatus}</strong></p>
            )}
            {result.data.errors?.length > 0 && (
              <ul className="pr-error-list">
                {result.data.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Refund Panel ─────────────────────────────────────────────────────────────
const RefundPanel = () => {
  const [txId, setTxId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txId.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const params = amount.trim() ? `?amount=${encodeURIComponent(amount.trim())}` : '';
      const url = `${configs.BASE_URL}/payments/admin/refund/${txId.trim()}${params}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({ type: 'success', data });
        setTxId('');
        setAmount('');
      } else {
        setResult({ type: 'error', data });
      }
    } catch (err) {
      setResult({ type: 'error', data: { message: 'Network error — could not reach the server.' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-panel">
      <div className="pr-panel__header">
        <i className="fas fa-undo-alt pr-panel__icon pr-panel__icon--refund" />
        <div>
          <h2 className="pr-panel__title">Issue a Refund</h2>
          <p className="pr-panel__desc">
            Issue a full or partial refund for any Flutterwave transaction directly from here.
            Leave the amount blank for a full refund.
          </p>
        </div>
      </div>

      <form className="pr-form" onSubmit={handleSubmit}>
        <label className="pr-label" htmlFor="refund-tx-id">
          Flutterwave Transaction ID
        </label>
        <input
          id="refund-tx-id"
          className="pr-input"
          type="text"
          placeholder="e.g. 3296847"
          value={txId}
          onChange={(e) => { setTxId(e.target.value); setResult(null); }}
          disabled={loading}
        />

        <label className="pr-label" htmlFor="refund-amount" style={{ marginTop: '14px' }}>
          Refund Amount (₦) — leave blank for full refund
        </label>
        <div className="pr-input-row">
          <input
            id="refund-amount"
            className="pr-input"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 2500 — blank = full refund"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setResult(null); }}
            disabled={loading}
          />
          <button className="pr-btn pr-btn--refund" type="submit" disabled={loading || !txId.trim()}>
            {loading ? <span className="pr-spinner" /> : 'Issue Refund'}
          </button>
        </div>
        <p className="pr-hint">
          Only successful transactions can be refunded. Pending or failed transactions will be rejected.
        </p>
      </form>

      {/* Success */}
      {result?.type === 'success' && (
        <div className="pr-alert pr-alert--success">
          <i className="fas fa-check-circle" />
          <div>
            <strong>Refund Issued Successfully</strong>
            <div className="pr-result-grid">
              <span>Flutterwave ID</span><span><code>{result.data.flutterwaveTransactionId}</code></span>
              <span>Refund ID</span><span><code>{result.data.refundId}</code></span>
              <span>Amount Refunded</span><span>{fmt(result.data.amountRefunded)}</span>
              <span>Refund Status</span><span>{result.data.refundStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {result?.type === 'error' && (
        <div className="pr-alert pr-alert--error">
          <i className="fas fa-times-circle" />
          <div>
            <strong>Refund Failed</strong>
            <p>{result.data.message}</p>
            {result.data.flutterwaveStatus && (
              <p>Flutterwave status: <strong>{result.data.flutterwaveStatus}</strong></p>
            )}
            {result.data.detail && <p className="pr-detail">{result.data.detail}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const PaymentResolution = () => (
  <div className="pr-page">
    <div className="pr-page__header">
      <h1 className="pr-page__title">
        <i className="fas fa-credit-card" /> Payment Resolution
      </h1>
      <p className="pr-page__subtitle">
        Resolve stuck payments and issue refunds directly — without going to the Flutterwave portal.
      </p>
    </div>

    <div className="pr-panels">
      <ResolvePanel />
      <RefundPanel />
    </div>
  </div>
);

export default PaymentResolution;
