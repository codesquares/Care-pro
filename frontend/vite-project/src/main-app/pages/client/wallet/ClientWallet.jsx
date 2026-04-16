import { useState, useEffect, useCallback } from "react";
import { FaWallet } from "react-icons/fa";
import ClientWalletService from "../../../services/clientWalletService";
import RefundRequestService, { REFUND_STATUS } from "../../../services/refundRequestService";
import "./ClientWallet.css";

const ClientWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refund request form
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState(null);
  const [refundSuccess, setRefundSuccess] = useState(null);

  // Refund history
  const [refundRequests, setRefundRequests] = useState([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    const result = await ClientWalletService.getWallet();
    if (result.success) {
      setWallet(result.data);
    } else {
      setError(result.error || "Failed to load wallet.");
    }
    setLoading(false);
  }, []);

  const fetchRefundRequests = useCallback(async () => {
    setLoadingRefunds(true);
    const result = await RefundRequestService.getMyRequests();
    if (result.success) {
      setRefundRequests(Array.isArray(result.data) ? result.data : []);
    }
    setLoadingRefunds(false);
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchRefundRequests();
  }, [fetchWallet, fetchRefundRequests]);

  const hasPendingRefund = refundRequests.some(
    (r) => r.status === REFUND_STATUS.PENDING
  );

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    setRefundError(null);
    setRefundSuccess(null);

    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      setRefundError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!refundReason.trim()) {
      setRefundError("Please provide a reason for the refund request.");
      return;
    }

    setSubmittingRefund(true);
    const result = await RefundRequestService.submitRequest({
      amount,
      reason: refundReason.trim(),
    });
    if (result.success) {
      setRefundSuccess("Refund request submitted. Pending admin review.");
      setRefundAmount("");
      setRefundReason("");
      setShowRefundForm(false);
      fetchRefundRequests();
    } else {
      setRefundError(result.error || "Failed to submit refund request.");
    }
    setSubmittingRefund(false);
  };

  if (loading) {
    return (
      <div className="cl-wallet-page">
        <div className="cl-wallet-container">
          <div className="cl-wallet__loading">Loading wallet…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cl-wallet-page">
        <div className="cl-wallet-container">
          <div className="cl-wallet__error">{error}</div>
        </div>
      </div>
    );
  }

  const fmt = ClientWalletService.formatCurrency;

  return (
    <div className="cl-wallet-page">
      {/* Hero banner */}
      <div className="cl-wallet__hero">
        <div className="cl-wallet__hero-left">
          <h1><span className="cl-wallet__hero-icon">💳</span>My Wallet</h1>
        </div>
        <div className="cl-wallet__hero-right">
          Manage your credit balance and request refunds to your bank account.
        </div>
      </div>

      <div className="cl-wallet-container">
        <h1 className="cl-wallet__title">
          <FaWallet style={{ marginRight: 8 }} /> My Wallet
        </h1>

        <div className="cl-wallet__balance-card">
          <span className="cl-wallet__balance-label">Available Credit</span>
          <span className="cl-wallet__balance-value">
            {fmt(wallet?.creditBalance ?? 0)}
          </span>
          <p className="cl-wallet__balance-hint">
            Credits from cancelled orders. You can request a refund to your bank account.
          </p>
        </div>

        <div className="cl-wallet__stats">
          <div className="cl-wallet__stat">
            <span className="cl-wallet__stat-label">Total Credited</span>
            <span className="cl-wallet__stat-value">
              {fmt(wallet?.totalCredited ?? 0)}
            </span>
          </div>
          <div className="cl-wallet__stat">
            <span className="cl-wallet__stat-label">Total Spent</span>
            <span className="cl-wallet__stat-value">
              {fmt(wallet?.totalSpent ?? 0)}
            </span>
          </div>
        </div>

        {wallet?.updatedAt && (
          <p className="cl-wallet__updated">
            Last updated: {new Date(wallet.updatedAt).toLocaleDateString()}
          </p>
        )}

        {/* Refund request section */}
        {(wallet?.creditBalance ?? 0) > 0 && (
          <div className="cl-wallet__refund-section">
            {refundSuccess && (
              <div className="cl-wallet__refund-success">{refundSuccess}</div>
            )}

            {!showRefundForm ? (
              <button
                className="cl-wallet__refund-btn"
                onClick={() => { setShowRefundForm(true); setRefundError(null); setRefundSuccess(null); }}
                disabled={hasPendingRefund}
              >
                {hasPendingRefund ? "Pending Refund Request…" : "Request Refund"}
              </button>
            ) : (
              <form onSubmit={handleSubmitRefund} className="cl-wallet__refund-form">
                <h3 className="cl-wallet__refund-form-title">Request Refund</h3>
                <div className="cl-wallet__refund-field">
                  <label>Amount (₦)</label>
                  <input
                    type="number"
                    min="1"
                    max={wallet.creditBalance}
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Max: ${fmt(wallet.creditBalance)}`}
                    required
                  />
                </div>
                <div className="cl-wallet__refund-field">
                  <label>Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Why are you requesting this refund?"
                    rows="3"
                    maxLength={1000}
                    required
                  />
                </div>
                {refundError && (
                  <div className="cl-wallet__refund-error">{refundError}</div>
                )}
                <div className="cl-wallet__refund-actions">
                  <button type="submit" disabled={submittingRefund} className="cl-wallet__refund-submit">
                    {submittingRefund ? "Submitting…" : "Submit Request"}
                  </button>
                  <button type="button" onClick={() => setShowRefundForm(false)} className="cl-wallet__refund-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Refund request history */}
        {refundRequests.length > 0 && (
          <div className="cl-wallet__refund-history">
            <h3 className="cl-wallet__refund-history-title">Refund Requests</h3>
            {loadingRefunds ? (
              <p className="cl-wallet__loading">Loading…</p>
            ) : (
              <div className="cl-wallet__refund-list">
                {refundRequests.map((req) => (
                  <div key={req.id} className="cl-wallet__refund-item">
                    <div className="cl-wallet__refund-item-top">
                      <span className="cl-wallet__refund-item-amount">{fmt(req.amount)}</span>
                      <span
                        className="cl-wallet__refund-status-badge"
                        style={{ backgroundColor: RefundRequestService.getStatusColor(req.status) }}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="cl-wallet__refund-item-reason">{req.reason}</p>
                    {req.adminNote && (
                      <p className="cl-wallet__refund-item-note">
                        <strong>Admin:</strong> {req.adminNote}
                      </p>
                    )}
                    <span className="cl-wallet__refund-item-date">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientWallet;
