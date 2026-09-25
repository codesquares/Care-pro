import { useState, useEffect, useCallback } from 'react';
import AdminPayrollService from '../../../services/adminPayrollService';
import adminService from '../../../services/adminService';
import './payroll-management.css';

const STATUS_FILTERS = ['Draft', 'Approved', 'Paid', 'All'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const fmtNaira = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `₦${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPeriod = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Draft');

  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const [caregiverNames, setCaregiverNames] = useState({}); // caregiverId -> name

  const loadPayrolls = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const result = await AdminPayrollService.getAllPayrolls();
    if (result.success) {
      setPayrolls(result.data || []);
    } else {
      setListError(result.error || 'Failed to load payroll records');
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  // Resolve caregiver display names lazily, one lookup per unique id.
  useEffect(() => {
    const missing = [...new Set(payrolls.map((p) => p.caregiverId))].filter(
      (id) => id && !(id in caregiverNames)
    );
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          const res = await adminService.getCaregiverById(id);
          const name = res.success
            ? `${res.data.firstName || ''} ${res.data.lastName || ''}`.trim() || '(unnamed caregiver)'
            : '(unknown caregiver)';
          return [id, name];
        })
      );
      if (!cancelled) {
        setCaregiverNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrolls]);

  const visiblePayrolls = statusFilter === 'All'
    ? payrolls
    : payrolls.filter((p) => p.status === statusFilter);

  // ─── Create payroll modal ─────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const openCreate = async () => {
    setCreateOpen(true);
    setSelectedAssignment(null);
    setCreateError(null);
    setLoadingAssignments(true);
    setAssignmentsError(null);
    const result = await AdminPayrollService.getAcceptedAssignments();
    if (result.success) {
      setAssignments(result.data || []);
    } else {
      setAssignmentsError(result.error || 'Failed to load accepted assignments');
    }
    setLoadingAssignments(false);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const handleCreateSubmit = async () => {
    if (!selectedAssignment) {
      setCreateError('Select an assignment first.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    const result = await AdminPayrollService.createPayroll({
      assignmentId: selectedAssignment.assignmentId,
      year,
      month,
    });
    if (result.success) {
      showToast('success', result.message || 'Payroll record created');
      setCreateOpen(false);
      loadPayrolls();
    } else {
      setCreateError(result.error || 'Failed to create payroll record');
    }
    setCreating(false);
  };

  // ─── Approve modal ─────────────────────────────────────────
  const [approveTarget, setApproveTarget] = useState(null);
  const [overrideOn, setOverrideOn] = useState(false);
  const [finalAmount, setFinalAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);

  const openApprove = (payroll) => {
    setApproveTarget(payroll);
    setOverrideOn(false);
    setFinalAmount(String(payroll.calculatedAmount));
    setOverrideReason('');
    setApproveError(null);
  };

  const closeApprove = () => {
    if (approving) return;
    setApproveTarget(null);
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    if (overrideOn) {
      const amt = Number(finalAmount);
      if (finalAmount === '' || Number.isNaN(amt) || amt < 0) {
        setApproveError('Enter a valid final amount.');
        return;
      }
      if (amt !== Number(approveTarget.calculatedAmount) && overrideReason.trim().length < 5) {
        setApproveError('A reason (at least 5 characters) is required when overriding the calculated amount.');
        return;
      }
    }
    setApproving(true);
    setApproveError(null);
    const overrides = overrideOn
      ? { finalAmount: Number(finalAmount), overrideReason: overrideReason.trim() || undefined }
      : {};
    const result = await AdminPayrollService.approvePayroll(approveTarget.id, overrides);
    if (result.success) {
      showToast('success', result.message || 'Payroll approved — caregiver wallet credited, notification sent.');
      setApproveTarget(null);
      loadPayrolls();
    } else {
      setApproveError(result.error || 'Failed to approve payroll record');
    }
    setApproving(false);
  };

  // ─── Mark-paid modal ────────────────────────────────────────
  const [markPaidTarget, setMarkPaidTarget] = useState(null);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);

  const handleMarkPaidConfirm = async () => {
    if (!markPaidTarget) return;
    setMarkPaidLoading(true);
    const result = await AdminPayrollService.markPaid(markPaidTarget.id);
    if (result.success) {
      showToast('success', result.message || 'Marked as paid');
      setMarkPaidTarget(null);
      loadPayrolls();
    } else {
      showToast('error', result.error || 'Failed to mark payroll record as paid');
    }
    setMarkPaidLoading(false);
  };

  return (
    <div className="payroll-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <div>
            <h1>Payroll</h1>
            <p>Create, override, and approve caregiver payroll — approval credits the wallet directly</p>
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

      <div className="pr-controls">
        <div className="pr-status-filters">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`pkg-pill${statusFilter === s ? ' pkg-pill--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="payroll-btn-secondary btn-sm" onClick={loadPayrolls} disabled={loadingList}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
        <button className="payroll-btn-primary btn-sm" onClick={openCreate}>
          <i className="fas fa-plus"></i> Create Payroll
        </button>
      </div>

      {listError && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <div><p>{listError}</p></div>
        </div>
      )}

      {loadingList ? (
        <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
      ) : visiblePayrolls.length === 0 ? (
        <div className="pkg-empty">
          <i className="fas fa-inbox"></i>
          <p>{payrolls.length === 0 ? 'No payroll records yet' : `No ${statusFilter.toLowerCase()} payroll records`}</p>
          {payrolls.length === 0 && (
            <button className="payroll-btn-primary" onClick={openCreate}>
              <i className="fas fa-plus"></i> Create First Payroll Record
            </button>
          )}
        </div>
      ) : (
        <div className="pkg-table-wrap">
          <table className="pkg-table">
            <thead>
              <tr>
                <th>Caregiver</th>
                <th>Pay Period</th>
                <th>Type</th>
                <th>Hours × Rate</th>
                <th>Calculated</th>
                <th>Final</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayrolls.map((p) => (
                <tr key={p.id}>
                  <td>{caregiverNames[p.caregiverId] || '…'}</td>
                  <td>{fmtPeriod(p.payPeriod)}</td>
                  <td><span className="pkg-badge pkg-badge--type">{p.payCalculationType}</span></td>
                  <td>
                    {p.payCalculationType === 'Hourly'
                      ? `${p.hoursWorked?.toFixed(2) ?? '—'}h × ${fmtNaira(p.rateApplied)}`
                      : '—'}
                  </td>
                  <td className="pkg-price-cell">{fmtNaira(p.calculatedAmount)}</td>
                  <td className="pkg-price-cell">
                    {fmtNaira(p.finalAmount)}
                    {Number(p.finalAmount) !== Number(p.calculatedAmount) && (
                      <span className="pr-override-badge" title={p.overrideReason || ''}>overridden</span>
                    )}
                  </td>
                  <td>
                    <span className={`pkg-badge pkg-badge--status-${p.status.toLowerCase()}`}>{p.status}</span>
                  </td>
                  <td className="pkg-actions">
                    {p.status === 'Draft' && (
                      <button className="payroll-btn-secondary btn-sm" onClick={() => openApprove(p)}>
                        <i className="fas fa-check"></i> Approve
                      </button>
                    )}
                    {p.status === 'Approved' && (
                      <button className="payroll-btn-secondary btn-sm" onClick={() => setMarkPaidTarget(p)}>
                        <i className="fas fa-hand-holding-usd"></i> Mark Paid
                      </button>
                    )}
                    {p.status === 'Paid' && <span className="pr-done">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pkg-count">{visiblePayrolls.length} of {payrolls.length} record{payrolls.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {createOpen && (
        <div className="pkg-modal-overlay" onClick={closeCreate}>
          <div className="pkg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2><i className="fas fa-plus"></i> Create Payroll Record</h2>
              <button className="pkg-modal-close" onClick={closeCreate}><i className="fas fa-times"></i></button>
            </div>
            <div className="pkg-modal-body">
              {createError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{createError}</p></div>
                </div>
              )}

              <div className="form-group">
                <label>Assignment <span className="required">*</span></label>
                {loadingAssignments ? (
                  <div className="pkg-loading"><div className="spinner"></div><p>Loading accepted assignments…</p></div>
                ) : assignmentsError ? (
                  <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i><div><p>{assignmentsError}</p></div></div>
                ) : assignments.length === 0 ? (
                  <div className="pkg-empty"><i className="fas fa-inbox"></i><p>No Accepted assignments found — a caregiver must accept an assignment before payroll can be run for it.</p></div>
                ) : (
                  <ul className="pr-assignment-list">
                    {assignments.map((a) => (
                      <li
                        key={a.assignmentId}
                        className={`pr-assignment-item${selectedAssignment?.assignmentId === a.assignmentId ? ' pr-assignment-item--active' : ''}`}
                        onClick={() => setSelectedAssignment(a)}
                      >
                        <div className="pr-assignment-main">
                          <strong>{a.caregiverName}</strong>
                          <span className="pkg-badge pkg-badge--type">{a.payCalculationType || 'unset'}</span>
                        </div>
                        <div className="pr-assignment-sub">{a.packageCategory} — {a.packageTierLabel}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pr-year">Year <span className="required">*</span></label>
                  <input id="pr-year" type="number" min="2020" max="2100" value={year}
                    onChange={(e) => setYear(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label htmlFor="pr-month">Month <span className="required">*</span></label>
                  <select id="pr-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <p className="form-hint">
                The amount is calculated server-side: real monthly hours × the caregiver's active pay rate for
                Hourly packages, or the package's Fixed pay for Live-in packages.
              </p>

              <div className="form-actions">
                <button type="button" className="payroll-btn-secondary" onClick={closeCreate} disabled={creating}>Cancel</button>
                <button type="button" className="payroll-btn-primary" onClick={handleCreateSubmit} disabled={creating || !selectedAssignment}>
                  {creating
                    ? <><i className="fas fa-spinner fa-spin"></i> Creating…</>
                    : <><i className="fas fa-save"></i> Create Draft</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVE MODAL ── */}
      {approveTarget && (
        <div className="pkg-modal-overlay" onClick={closeApprove}>
          <div className="pkg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2><i className="fas fa-check"></i> Approve Payroll</h2>
              <button className="pkg-modal-close" onClick={closeApprove}><i className="fas fa-times"></i></button>
            </div>
            <div className="pkg-modal-body">
              {approveError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{approveError}</p></div>
                </div>
              )}
              <p>
                <strong>{caregiverNames[approveTarget.caregiverId] || approveTarget.caregiverId}</strong>{' '}
                — {fmtPeriod(approveTarget.payPeriod)}
              </p>
              <p className="pr-calculated-line">
                Calculated amount: <strong>{fmtNaira(approveTarget.calculatedAmount)}</strong>
                {approveTarget.payCalculationType === 'Hourly' &&
                  ` (${approveTarget.hoursWorked?.toFixed(2)}h × ${fmtNaira(approveTarget.rateApplied)})`}
              </p>

              <label className="pr-override-toggle">
                <input type="checkbox" checked={overrideOn} onChange={(e) => setOverrideOn(e.target.checked)} />
                Override the final amount
              </label>

              {overrideOn && (
                <>
                  <div className="form-group">
                    <label htmlFor="pr-final-amount">Final Amount (₦) <span className="required">*</span></label>
                    <input
                      id="pr-final-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pr-override-reason">Reason for override <span className="required">*</span></label>
                    <textarea
                      id="pr-override-reason"
                      rows={3}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Adjusted for a public-holiday rate agreed with the client"
                    />
                  </div>
                </>
              )}

              <p className="form-hint">
                Approving credits the caregiver's withdrawable wallet balance immediately and sends both an
                in-app and email notification. This cannot be undone from this screen.
              </p>

              <div className="form-actions">
                <button type="button" className="payroll-btn-secondary" onClick={closeApprove} disabled={approving}>Cancel</button>
                <button type="button" className="payroll-btn-primary" onClick={handleApproveConfirm} disabled={approving}>
                  {approving
                    ? <><i className="fas fa-spinner fa-spin"></i> Approving…</>
                    : <><i className="fas fa-check"></i> Approve &amp; Credit Wallet</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MARK PAID CONFIRM MODAL ── */}
      {markPaidTarget && (
        <div className="pkg-modal-overlay" onClick={() => !markPaidLoading && setMarkPaidTarget(null)}>
          <div className="pkg-modal pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2><i className="fas fa-hand-holding-usd"></i> Mark as Paid</h2>
            </div>
            <div className="pkg-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                Mark this payroll record as paid? This is a reconciliation status only — the caregiver's wallet
                was already credited when it was approved; no money moves now.
              </p>
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button className="payroll-btn-secondary" onClick={() => setMarkPaidTarget(null)} disabled={markPaidLoading}>Cancel</button>
                <button className="payroll-btn-primary" onClick={handleMarkPaidConfirm} disabled={markPaidLoading}>
                  {markPaidLoading
                    ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                    : <><i className="fas fa-check"></i> Mark Paid</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
