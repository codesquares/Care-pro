import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminAssignmentService from '../../../services/adminAssignmentService';
import adminService from '../../../services/adminService';
import './assignment-console.css';

const STATUS_FILTERS = ['pending', 'assigned', 'confirmed', 'cancelled', 'all'];

const fmtNaira = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `₦${Number(value).toLocaleString('en-NG')}`;

const AssignmentConsole = () => {
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'pending'
  const [toast, setToast] = useState(null); // { type, msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── Package request picker ──────────────────────────────
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    setRequestsError(null);
    const result = await AdminAssignmentService.getPackageRequests(statusFilter === 'all' ? undefined : statusFilter);
    if (result.success) {
      setRequests(result.data || []);
    } else {
      setRequestsError(result.error || 'Failed to load package requests');
    }
    setLoadingRequests(false);
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'assign') loadRequests();
  }, [activeTab, loadRequests]);

  const visibleRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      const haystack = `${r.clientName} ${r.packageCategory} ${r.packageTierLabel} ${r.requiredSpecialty || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [requests, searchTerm]);

  // ─── Candidates for selected request ─────────────────────
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [assignBlockers, setAssignBlockers] = useState(null); // { caregiverId, reasons }

  const selectRequest = async (req) => {
    setSelectedRequest(req);
    setCandidates([]);
    setCandidatesError(null);
    setAssignBlockers(null);
    setLoadingCandidates(true);
    const result = await AdminAssignmentService.getCandidates(req.id);
    if (result.success) {
      setCandidates(result.data || []);
    } else {
      setCandidatesError(result.error || 'Failed to load candidates');
    }
    setLoadingCandidates(false);
  };

  const handleAssign = async (candidate) => {
    if (!selectedRequest) return;
    setAssigningId(candidate.caregiverId);
    setAssignBlockers(null);
    const result = await AdminAssignmentService.createAssignment({
      packageRequestId: selectedRequest.id,
      caregiverId: candidate.caregiverId,
      matchScore: candidate.matchScore,
    });
    if (result.success) {
      showToast('success', `${candidate.caregiverName} assigned — awaiting their acceptance.`);
      setSelectedRequest(null);
      setCandidates([]);
      loadRequests();
      setActiveTab('pending');
    } else if (result.reasons && result.reasons.length > 0) {
      setAssignBlockers({ caregiverId: candidate.caregiverId, reasons: result.reasons });
    } else {
      showToast('error', result.error || 'Failed to assign caregiver');
    }
    setAssigningId(null);
  };

  // ─── Pending Acceptance view ──────────────────────────────
  const [pendingList, setPendingList] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState(null);
  const [clientNames, setClientNames] = useState({}); // clientId -> name

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    setPendingError(null);
    const result = await AdminAssignmentService.getPendingAcceptance();
    if (result.success) {
      setPendingList(result.data || []);
    } else {
      setPendingError(result.error || 'Failed to load pending acceptance list');
    }
    setLoadingPending(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') loadPending();
  }, [activeTab, loadPending]);

  // Resolve client display names lazily, one lookup per unique id.
  useEffect(() => {
    const missing = [...new Set(pendingList.map((p) => p.clientId))].filter(
      (id) => id && !(id in clientNames)
    );
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          const res = await adminService.getClientById(id);
          const name = res.success
            ? `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim() || '(unnamed client)'
            : '(unknown client)';
          return [id, name];
        })
      );
      if (!cancelled) {
        setClientNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingList]);

  // ─── Cancel a pending assignment ──────────────────────────
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 5) {
      showToast('error', 'Reason must be at least 5 characters');
      return;
    }
    setCancelLoading(true);
    const result = await AdminAssignmentService.cancelAssignment(cancelTarget.assignmentId, cancelReason.trim());
    if (result.success) {
      showToast('success', result.message || 'Assignment cancelled');
      setCancelTarget(null);
      loadPending();
    } else {
      showToast('error', result.error || 'Failed to cancel assignment');
    }
    setCancelLoading(false);
  };

  return (
    <div className="assignment-console">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div>
            <h1>Assignment Console</h1>
            <p>Match a caregiver to a package request and track who's awaiting a response</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="asc-tabs">
        <button
          className={`asc-tab${activeTab === 'assign' ? ' asc-tab--active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          <i className="fas fa-search"></i> Assign Caregiver
        </button>
        <button
          className={`asc-tab${activeTab === 'pending' ? ' asc-tab--active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <i className="fas fa-hourglass-half"></i> Pending Acceptance
          {pendingList.length > 0 && <span className="asc-tab-badge">{pendingList.length}</span>}
        </button>
      </div>

      {activeTab === 'assign' && (
        <div className="asc-assign-layout">
          {/* ── Left: package request picker ── */}
          <div className="asc-panel asc-panel--requests">
            <div className="asc-panel-header">
              <h2>Package Requests</h2>
              <button className="asc-btn-secondary btn-sm" onClick={loadRequests} disabled={loadingRequests}>
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="asc-status-filters">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`pkg-pill${statusFilter === s ? ' pkg-pill--active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="asc-search-wrap">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by client, category, tier…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {requestsError && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <div><p>{requestsError}</p></div>
              </div>
            )}

            {loadingRequests ? (
              <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
            ) : visibleRequests.length === 0 ? (
              <div className="pkg-empty">
                <i className="fas fa-inbox"></i>
                <p>No package requests {statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}</p>
              </div>
            ) : (
              <ul className="asc-request-list">
                {visibleRequests.map((r) => (
                  <li
                    key={r.id}
                    className={`asc-request-item${selectedRequest?.id === r.id ? ' asc-request-item--active' : ''}`}
                    onClick={() => selectRequest(r)}
                  >
                    <div className="asc-request-main">
                      <strong>{r.clientName}</strong>
                      <span className={`pkg-badge pkg-badge--status-${r.status}`}>{r.status}</span>
                    </div>
                    <div className="asc-request-sub">
                      {r.packageCategory} — {r.packageTierLabel}
                      <small>{r.requiredCaregiverType}{r.requiredSpecialty ? ` · ${r.requiredSpecialty}` : ''}</small>
                    </div>
                    <div className="asc-request-meta">
                      {r.location && <span><i className="fas fa-map-marker-alt"></i> {r.location}</span>}
                      {r.budget != null && <span>{fmtNaira(r.budget)}</span>}
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Right: candidates for selected request ── */}
          <div className="asc-panel asc-panel--candidates">
            {!selectedRequest ? (
              <div className="pkg-empty">
                <i className="fas fa-hand-point-left"></i>
                <p>Select a package request to see ranked candidates</p>
              </div>
            ) : (
              <>
                <div className="asc-panel-header">
                  <h2>
                    Candidates for {selectedRequest.clientName}
                    <small>{selectedRequest.packageCategory} — {selectedRequest.packageTierLabel}</small>
                  </h2>
                </div>
                <p className="asc-required-hint">
                  Requires <strong>{selectedRequest.requiredCaregiverType}</strong>
                  {selectedRequest.requiredSpecialty ? <> · <strong>{selectedRequest.requiredSpecialty}</strong></> : ''}
                  {' '}— every candidate below already matches this.
                </p>

                {selectedRequest.status !== 'pending' && (
                  <div className="alert alert-error" style={{ marginTop: 0 }}>
                    <i className="fas fa-exclamation-circle"></i>
                    <div><p>This request is "{selectedRequest.status}" — it can't be assigned unless it's back to "pending".</p></div>
                  </div>
                )}

                {candidatesError && (
                  <div className="alert alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <div><p>{candidatesError}</p></div>
                  </div>
                )}

                {loadingCandidates ? (
                  <div className="pkg-loading"><div className="spinner"></div><p>Finding candidates…</p></div>
                ) : candidates.length === 0 && !candidatesError ? (
                  <div className="pkg-empty">
                    <i className="fas fa-user-slash"></i>
                    <p>No matching candidates found</p>
                  </div>
                ) : (
                  <ul className="asc-candidate-list">
                    {candidates.map((c) => (
                      <li key={c.caregiverId} className="asc-candidate-card">
                        <div className="asc-candidate-rank">#{c.rank}</div>
                        <div className="asc-candidate-body">
                          <div className="asc-candidate-top">
                            <strong>{c.caregiverName}</strong>
                            <span className="asc-score-badge">Score {Math.round(c.matchScore)}</span>
                          </div>
                          <div className="asc-candidate-meta">
                            {c.location && <span><i className="fas fa-map-marker-alt"></i> {c.location}</span>}
                            {c.distanceKm != null && <span>{c.distanceKm.toFixed(1)} km away</span>}
                            <span><i className="fas fa-star"></i> {c.averageRating?.toFixed(1) ?? '—'} ({c.reviewCount})</span>
                            <span className={c.isAvailable ? 'asc-available' : 'asc-unavailable'}>
                              {c.isAvailable ? 'Available' : 'Not marked available'}
                            </span>
                          </div>
                          {c.aboutMe && <p className="asc-candidate-about">{c.aboutMe}</p>}
                          {assignBlockers?.caregiverId === c.caregiverId && (
                            <div className="alert alert-error asc-candidate-blockers">
                              <i className="fas fa-exclamation-circle"></i>
                              <div>
                                <p>Not ready to be assigned:</p>
                                <ul>{assignBlockers.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="asc-btn-primary btn-sm"
                          onClick={() => handleAssign(c)}
                          disabled={assigningId === c.caregiverId || selectedRequest.status !== 'pending'}
                        >
                          {assigningId === c.caregiverId
                            ? <><i className="fas fa-spinner fa-spin"></i> Assigning…</>
                            : <><i className="fas fa-user-check"></i> Assign</>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="asc-panel">
          <div className="asc-panel-header">
            <h2>Awaiting caregiver response</h2>
            <button className="asc-btn-secondary btn-sm" onClick={loadPending} disabled={loadingPending}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
          <p className="asc-required-hint">
            No assignment times out automatically — a stalled row here needs a staff decision: wait, or cancel and try another candidate.
          </p>

          {pendingError && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <div><p>{pendingError}</p></div>
            </div>
          )}

          {loadingPending ? (
            <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : pendingList.length === 0 ? (
            <div className="pkg-empty">
              <i className="fas fa-check-circle"></i>
              <p>Nothing awaiting acceptance</p>
            </div>
          ) : (
            <div className="pkg-table-wrap">
              <table className="pkg-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Package</th>
                    <th>Caregiver</th>
                    <th>Assigned</th>
                    <th>Pending For</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((row) => {
                    const stale = row.pendingForHours >= 24;
                    return (
                      <tr key={row.assignmentId} className={stale ? 'asc-row--stale' : ''}>
                        <td>{clientNames[row.clientId] || '…'}</td>
                        <td>{row.packageCategory} — {row.packageTierLabel}</td>
                        <td>{row.caregiverName}</td>
                        <td>{new Date(row.assignedAt).toLocaleString()}</td>
                        <td>
                          <span className={`pkg-badge ${stale ? 'pkg-badge--inactive' : 'pkg-badge--type'}`}>
                            {row.pendingForHuman}
                          </span>
                        </td>
                        <td>
                          <button className="asc-btn-secondary btn-sm" onClick={() => openCancel(row)}>
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="pkg-count">{pendingList.length} awaiting response</p>
            </div>
          )}
        </div>
      )}

      {/* ── CANCEL MODAL ── */}
      {cancelTarget && (
        <div className="pkg-modal-overlay" onClick={() => !cancelLoading && setCancelTarget(null)}>
          <div className="pkg-modal pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header pkg-modal-header--danger">
              <h2><i className="fas fa-exclamation-triangle"></i> Cancel Assignment</h2>
            </div>
            <div className="pkg-modal-body">
              <p>
                Withdraw the assignment of <strong>{cancelTarget.caregiverName}</strong> to{' '}
                <strong>{clientNames[cancelTarget.clientId] || 'this client'}</strong>? The request goes back to
                "pending" so you can try a different candidate.
              </p>
              <div className="form-group">
                <label htmlFor="cancel-reason">Reason <span className="required">*</span></label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  minLength={5}
                  placeholder="e.g. Caregiver unreachable for 2 days, trying another candidate"
                />
              </div>
              <div className="form-actions">
                <button className="asc-btn-secondary" onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
                  Keep waiting
                </button>
                <button className="asc-btn-danger" onClick={handleCancelConfirm} disabled={cancelLoading}>
                  {cancelLoading
                    ? <><i className="fas fa-spinner fa-spin"></i> Cancelling…</>
                    : <><i className="fas fa-times"></i> Cancel Assignment</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentConsole;
