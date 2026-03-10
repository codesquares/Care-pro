import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import DisputeService from '../../../services/disputeService';
import './disputes-management.css';

const DisputesManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Detail / action modal
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [actionMode, setActionMode] = useState(null); // null | 'resolve' | 'dismiss'
  const [resolutionAction, setResolutionAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await DisputeService.getAll({
      page: currentPage,
      pageSize,
      status: statusFilter || undefined,
      disputeType: typeFilter || undefined,
    });
    if (result.success) {
      const data = result.data;
      setDisputes(data.items || data.Items || data || []);
      setTotalCount(data.totalCount || data.TotalCount || 0);
      setHasMore(data.hasMore || data.HasMore || false);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [currentPage, pageSize, statusFilter, typeFilter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter]);

  const openDetail = (dispute) => {
    setSelectedDispute(dispute);
    setActionMode(null);
    setResolutionAction('');
    setAdminNotes('');
    setResolutionSummary('');
  };

  const closeDetail = () => {
    setSelectedDispute(null);
    setActionMode(null);
  };

  const handleMarkUnderReview = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    const result = await DisputeService.markUnderReview(selectedDispute.id);
    if (result.success) {
      toast.success('Dispute marked as Under Review');
      setSelectedDispute(result.data);
      loadDisputes();
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
  };

  const handleResolve = async () => {
    if (!resolutionAction) { toast.error('Select a resolution action'); return; }
    if (!adminNotes.trim()) { toast.error('Admin notes are required'); return; }
    if (!resolutionSummary.trim()) { toast.error('Resolution summary is required'); return; }

    setActionLoading(true);
    const result = await DisputeService.resolveDispute(selectedDispute.id, {
      resolutionAction,
      adminNotes,
      resolutionSummary,
    });
    if (result.success) {
      toast.success('Dispute resolved');
      setSelectedDispute(result.data);
      setActionMode(null);
      loadDisputes();
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
  };

  const handleDismiss = async () => {
    if (!adminNotes.trim()) { toast.error('Admin notes are required'); return; }

    setActionLoading(true);
    const result = await DisputeService.dismissDispute(selectedDispute.id, {
      adminNotes,
      resolutionSummary,
    });
    if (result.success) {
      toast.success('Dispute dismissed');
      setSelectedDispute(result.data);
      setActionMode(null);
      loadDisputes();
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
  };

  const statusColor = (status) => DisputeService.STATUS_COLORS[status] || '#666';

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Stats for quick summary
  const openCount = disputes.filter(d => d.status === 'Open').length;
  const reviewCount = disputes.filter(d => d.status === 'UnderReview').length;

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h1>Dispute Management</h1>
        <p className="dm-subtitle">Review and resolve client disputes</p>
      </div>

      {/* Quick stats */}
      <div className="dm-stats">
        <div className="dm-stat-card dm-stat--open">
          <span className="dm-stat-num">{openCount}</span>
          <span className="dm-stat-label">Open</span>
        </div>
        <div className="dm-stat-card dm-stat--review">
          <span className="dm-stat-num">{reviewCount}</span>
          <span className="dm-stat-label">Under Review</span>
        </div>
        <div className="dm-stat-card dm-stat--total">
          <span className="dm-stat-num">{totalCount}</span>
          <span className="dm-stat-label">Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="dm-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(DisputeService.STATUSES).map((s) => (
            <option key={s} value={s}>{DisputeService.STATUSES[s]}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="Order">Order</option>
          <option value="Visit">Visit</option>
        </select>
        <button className="dm-refresh-btn" onClick={loadDisputes} disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="dm-error">{error}</div>}

      {/* Table */}
      {loading && disputes.length === 0 ? (
        <div className="dm-loading">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="dm-empty">No disputes found.</div>
      ) : (
        <div className="dm-table-wrapper">
          <table className="dm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Category</th>
                <th>Status</th>
                <th>Client</th>
                <th>Caregiver</th>
                <th>Raised</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className={d.status === 'Open' ? 'dm-row--open' : ''}>
                  <td>
                    <span className={`dm-type-badge dm-type--${d.disputeType?.toLowerCase()}`}>
                      {d.disputeType}
                    </span>
                  </td>
                  <td>{DisputeService.ORDER_CATEGORIES[d.category] || DisputeService.VISIT_CATEGORIES[d.category] || d.category}</td>
                  <td><span style={{ color: statusColor(d.status), fontWeight: 600 }}>{d.status}</span></td>
                  <td>{d.clientName || d.clientId?.slice(0, 8)}</td>
                  <td>{d.caregiverName || d.caregiverId?.slice(0, 8)}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="dm-view-btn" onClick={() => openDetail(d)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dm-pagination">
          <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={!hasMore && currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
        </div>
      )}

      {/* Detail / Action Modal */}
      {selectedDispute && (
        <div className="dm-modal-overlay" onClick={closeDetail}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-header">
              <h2>Dispute Details</h2>
              <button className="dm-modal-close" onClick={closeDetail}>✕</button>
            </div>
            <div className="dm-modal-body">
              <div className="dm-detail-grid">
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Status</span>
                  <span style={{ color: statusColor(selectedDispute.status), fontWeight: 600 }}>{selectedDispute.status}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Type</span>
                  <span>{selectedDispute.disputeType}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Category</span>
                  <span>{DisputeService.ORDER_CATEGORIES[selectedDispute.category] || DisputeService.VISIT_CATEGORIES[selectedDispute.category] || selectedDispute.category}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Order ID</span>
                  <span className="dm-detail-mono">{selectedDispute.orderId}</span>
                </div>
                {selectedDispute.taskSheetId && (
                  <div className="dm-detail-item">
                    <span className="dm-detail-label">Task Sheet ID</span>
                    <span className="dm-detail-mono">{selectedDispute.taskSheetId}</span>
                  </div>
                )}
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Client</span>
                  <span>{selectedDispute.clientName || selectedDispute.clientId}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Caregiver</span>
                  <span>{selectedDispute.caregiverName || selectedDispute.caregiverId}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Raised By</span>
                  <span>{selectedDispute.raisedByName || selectedDispute.raisedBy}</span>
                </div>
                <div className="dm-detail-item">
                  <span className="dm-detail-label">Raised</span>
                  <span>{new Date(selectedDispute.createdAt).toLocaleString()}</span>
                </div>
                {selectedDispute.resolvedAt && (
                  <div className="dm-detail-item">
                    <span className="dm-detail-label">Resolved</span>
                    <span>{new Date(selectedDispute.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="dm-detail-section">
                <h4>Reason</h4>
                <p className="dm-detail-text">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.resolutionAction && (
                <div className="dm-detail-section">
                  <h4>Resolution</h4>
                  <p><strong>Action:</strong> {DisputeService.RESOLUTION_ACTIONS[selectedDispute.resolutionAction] || selectedDispute.resolutionAction}</p>
                  {selectedDispute.resolutionSummary && <p><strong>Summary:</strong> {selectedDispute.resolutionSummary}</p>}
                  {selectedDispute.adminNotes && <p><strong>Admin Notes:</strong> {selectedDispute.adminNotes}</p>}
                  {selectedDispute.resolvedByName && <p><strong>Resolved By:</strong> {selectedDispute.resolvedByName}</p>}
                </div>
              )}

              {/* Action Buttons */}
              {(selectedDispute.status === 'Open' || selectedDispute.status === 'UnderReview') && !actionMode && (
                <div className="dm-action-bar">
                  {selectedDispute.status === 'Open' && (
                    <button className="dm-btn dm-btn--review" onClick={handleMarkUnderReview} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : '🔍 Mark Under Review'}
                    </button>
                  )}
                  <button className="dm-btn dm-btn--resolve" onClick={() => setActionMode('resolve')} disabled={actionLoading}>
                    ✅ Resolve
                  </button>
                  <button className="dm-btn dm-btn--dismiss" onClick={() => setActionMode('dismiss')} disabled={actionLoading}>
                    🚫 Dismiss
                  </button>
                </div>
              )}

              {/* Resolve Form */}
              {actionMode === 'resolve' && (
                <div className="dm-action-form">
                  <h4>Resolve Dispute</h4>
                  <div className="dm-form-group">
                    <label>Resolution Action <span className="dm-required">*</span></label>
                    <select value={resolutionAction} onChange={(e) => setResolutionAction(e.target.value)}>
                      <option value="">Select action...</option>
                      {Object.entries(DisputeService.RESOLUTION_ACTIONS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dm-form-group">
                    <label>Admin Notes <span className="dm-required">*</span></label>
                    <textarea
                      placeholder="Evidence reviewed, who was contacted, reasoning..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="4"
                    />
                  </div>
                  <div className="dm-form-group">
                    <label>Resolution Summary (sent to client/caregiver) <span className="dm-required">*</span></label>
                    <textarea
                      placeholder="Brief outcome explanation..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="dm-form-actions">
                    <button className="dm-btn dm-btn--resolve" onClick={handleResolve} disabled={actionLoading}>
                      {actionLoading ? 'Resolving...' : 'Confirm Resolution'}
                    </button>
                    <button className="dm-btn dm-btn--cancel" onClick={() => setActionMode(null)} disabled={actionLoading}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Dismiss Form */}
              {actionMode === 'dismiss' && (
                <div className="dm-action-form">
                  <h4>Dismiss Dispute</h4>
                  <div className="dm-form-group">
                    <label>Admin Notes (reason for dismissal) <span className="dm-required">*</span></label>
                    <textarea
                      placeholder="Why this dispute is being dismissed..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="4"
                    />
                  </div>
                  <div className="dm-form-group">
                    <label>Summary (optional, sent to client/caregiver)</label>
                    <textarea
                      placeholder="Brief explanation..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      rows="2"
                    />
                  </div>
                  <div className="dm-form-actions">
                    <button className="dm-btn dm-btn--dismiss" onClick={handleDismiss} disabled={actionLoading}>
                      {actionLoading ? 'Dismissing...' : 'Confirm Dismissal'}
                    </button>
                    <button className="dm-btn dm-btn--cancel" onClick={() => setActionMode(null)} disabled={actionLoading}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesManagement;
