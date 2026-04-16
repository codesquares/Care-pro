import { useState, useEffect, useCallback } from 'react';
import RefundRequestService, { REFUND_STATUS } from '../../../services/refundRequestService';
import ClientWalletService from '../../../services/clientWalletService';
import './RefundManagement.css';

const RefundManagement = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(null); // requestId being actioned
  const [adminNote, setAdminNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(null); // { requestId, action }
  const [actionError, setActionError] = useState(null);

  const fmt = ClientWalletService.formatCurrency;

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await RefundRequestService.getAllRequests();
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : [];
        setRequests(data);
      } else {
        setError(result.error || 'Failed to load refund requests.');
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching refund requests:', err);
      setError('Failed to load refund requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (filter === 'all') {
      setFiltered(requests);
    } else {
      setFiltered(requests.filter((r) => r.status === filter));
    }
  }, [filter, requests]);

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ── Review action (approve / reject) ──
  const handleReview = async (requestId, status) => {
    setActionLoading(requestId);
    setActionError(null);
    const result = await RefundRequestService.reviewRequest(requestId, {
      status,
      adminNote: adminNote.trim() || undefined,
    });
    if (result.success) {
      setShowNoteModal(null);
      setAdminNote('');
      await fetchRequests();
    } else {
      setActionError(result.error || `Failed to ${status.toLowerCase()} request.`);
    }
    setActionLoading(null);
  };

  // ── Mark complete ──
  const handleComplete = async (requestId) => {
    setActionLoading(requestId);
    setActionError(null);
    const result = await RefundRequestService.completeRequest(requestId);
    if (result.success) {
      await fetchRequests();
    } else {
      setActionError(result.error || 'Failed to mark as completed.');
    }
    setActionLoading(null);
  };

  const openNoteModal = (requestId, action) => {
    setAdminNote('');
    setActionError(null);
    setShowNoteModal({ requestId, action });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case REFUND_STATUS.PENDING:   return 'rfm-badge rfm-badge--pending';
      case REFUND_STATUS.APPROVED:  return 'rfm-badge rfm-badge--approved';
      case REFUND_STATUS.REJECTED:  return 'rfm-badge rfm-badge--rejected';
      case REFUND_STATUS.COMPLETED: return 'rfm-badge rfm-badge--completed';
      default: return 'rfm-badge';
    }
  };

  const renderActions = (req) => {
    const loading = actionLoading === req.id;
    switch (req.status) {
      case REFUND_STATUS.PENDING:
        return (
          <div className="rfm-action-btns">
            <button className="rfm-btn rfm-btn--approve" disabled={loading} onClick={() => openNoteModal(req.id, 'Approved')}>
              {loading ? '…' : 'Approve'}
            </button>
            <button className="rfm-btn rfm-btn--reject" disabled={loading} onClick={() => openNoteModal(req.id, 'Rejected')}>
              {loading ? '…' : 'Reject'}
            </button>
          </div>
        );
      case REFUND_STATUS.APPROVED:
        return (
          <button className="rfm-btn rfm-btn--complete" disabled={loading} onClick={() => handleComplete(req.id)}>
            {loading ? 'Processing…' : 'Mark Completed'}
          </button>
        );
      case REFUND_STATUS.COMPLETED:
        return <span className="rfm-action-done">✓ Processed</span>;
      case REFUND_STATUS.REJECTED:
        return <span className="rfm-action-rejected">Rejected</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="rfm-page">
        <h2 className="rfm-title">Refund Management</h2>
        <div className="rfm-loading">Loading refund requests…</div>
      </div>
    );
  }

  return (
    <div className="rfm-page">
      <h2 className="rfm-title">Refund Management</h2>

      {error && <div className="rfm-error">{error}</div>}

      <div className="rfm-filter">
        <label htmlFor="rfm-status-filter">Filter by status:</label>
        <select id="rfm-status-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="rfm-select">
          <option value="all">All Requests</option>
          <option value={REFUND_STATUS.PENDING}>Pending</option>
          <option value={REFUND_STATUS.APPROVED}>Approved</option>
          <option value={REFUND_STATUS.REJECTED}>Rejected</option>
          <option value={REFUND_STATUS.COMPLETED}>Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rfm-empty">No refund requests found.</div>
      ) : (
        <div className="rfm-table-wrap">
          <table className="rfm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Wallet Balance (at request)</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Admin Note</th>
                <th>Reviewed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td>{formatDateTime(req.createdAt)}</td>
                  <td>{req.clientName || '—'}</td>
                  <td>{req.clientEmail || '—'}</td>
                  <td className="rfm-amount">{fmt(req.amount)}</td>
                  <td>{fmt(req.walletBalanceAtRequest)}</td>
                  <td className="rfm-reason">{req.reason}</td>
                  <td><span className={getStatusBadgeClass(req.status)}>{req.status}</span></td>
                  <td className="rfm-note">{req.adminNote || '—'}</td>
                  <td>{req.reviewedAt ? formatDateTime(req.reviewedAt) : '—'}</td>
                  <td>{renderActions(req)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin note modal for approve / reject */}
      {showNoteModal && (
        <div className="rfm-modal-overlay" onClick={() => setShowNoteModal(null)}>
          <div className="rfm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{showNoteModal.action === 'Approved' ? 'Approve' : 'Reject'} Refund Request</h3>
            <p className="rfm-modal-desc">
              {showNoteModal.action === 'Approved'
                ? 'Approving will debit the client\'s wallet. You\'ll then need to do the bank transfer and mark it complete.'
                : 'Rejecting will leave the wallet balance unchanged.'}
            </p>
            <div className="rfm-modal-field">
              <label>Admin Note (optional):</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note for the client…"
                rows="3"
                maxLength={1000}
              />
            </div>
            {actionError && <div className="rfm-modal-error">{actionError}</div>}
            <div className="rfm-modal-actions">
              <button
                className={`rfm-btn ${showNoteModal.action === 'Approved' ? 'rfm-btn--approve' : 'rfm-btn--reject'}`}
                disabled={actionLoading === showNoteModal.requestId}
                onClick={() => handleReview(showNoteModal.requestId, showNoteModal.action)}
              >
                {actionLoading === showNoteModal.requestId
                  ? 'Processing…'
                  : `Confirm ${showNoteModal.action === 'Approved' ? 'Approval' : 'Rejection'}`}
              </button>
              <button className="rfm-btn rfm-btn--cancel" onClick={() => setShowNoteModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
