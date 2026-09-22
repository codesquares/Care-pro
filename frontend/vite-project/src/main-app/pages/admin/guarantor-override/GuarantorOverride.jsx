import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminGuarantorService from '../../../services/adminGuarantorService';
import adminService from '../../../services/adminService';
import './guarantor-override.css';

const MIN_REASON_LENGTH = 5;

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const GuarantorOverride = () => {
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  // ─── Caregiver picker ──────────────────────────────────────
  const [caregivers, setCaregivers] = useState([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [caregiversError, setCaregiversError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingCaregivers(true);
      setCaregiversError(null);
      const result = await adminService.getAllCaregivers();
      if (result.success) {
        setCaregivers(result.data || []);
      } else {
        setCaregiversError(result.error || 'Failed to load caregivers');
      }
      setLoadingCaregivers(false);
    })();
  }, []);

  const visibleCaregivers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return caregivers;
    return caregivers.filter((c) => {
      const haystack = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [caregivers, searchTerm]);

  // ─── Guarantors for selected caregiver ─────────────────────
  const [guarantors, setGuarantors] = useState([]);
  const [loadingGuarantors, setLoadingGuarantors] = useState(false);
  const [guarantorsError, setGuarantorsError] = useState(null);

  const loadGuarantors = useCallback(async (caregiverId) => {
    setLoadingGuarantors(true);
    setGuarantorsError(null);
    const result = await AdminGuarantorService.getGuarantors(caregiverId);
    if (result.success) {
      setGuarantors(result.data || []);
    } else {
      setGuarantorsError(result.error || 'Failed to load guarantors');
    }
    setLoadingGuarantors(false);
  }, []);

  const selectCaregiver = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setGuarantors([]);
    loadGuarantors(caregiver.id);
  };

  // ─── Manual confirm modal ───────────────────────────────────
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  const openConfirm = (guarantor) => {
    setConfirmTarget(guarantor);
    setReason('');
    setConfirmError(null);
  };

  const closeConfirm = () => {
    if (confirming) return;
    setConfirmTarget(null);
  };

  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < MIN_REASON_LENGTH;
  const canSubmitConfirm = reason.trim().length >= MIN_REASON_LENGTH;

  const handleConfirmSubmit = async () => {
    if (!confirmTarget) return;
    if (!canSubmitConfirm) {
      setConfirmError(`Reason must be at least ${MIN_REASON_LENGTH} characters.`);
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    const wasAlreadyConfirmed = confirmTarget.status === 'confirmed';
    const result = await AdminGuarantorService.confirmGuarantor(confirmTarget.id, reason.trim());
    if (result.success) {
      showToast(
        'success',
        wasAlreadyConfirmed
          ? `${confirmTarget.name} was already confirmed (via ${confirmTarget.confirmationMethod || 'unknown'}) — no change made.`
          : `${confirmTarget.name} confirmed.`
      );
      setConfirmTarget(null);
      if (selectedCaregiver) loadGuarantors(selectedCaregiver.id);
    } else {
      setConfirmError(result.error || 'Failed to confirm guarantor');
    }
    setConfirming(false);
  };

  // ─── Resend confirmation link ───────────────────────────────
  const [resendingId, setResendingId] = useState(null);

  const handleResend = async (guarantor) => {
    setResendingId(guarantor.id);
    const result = await AdminGuarantorService.resendConfirmation(guarantor.id);
    if (result.success) {
      showToast('success', `Confirmation link resent to ${guarantor.name}.`);
      if (selectedCaregiver) loadGuarantors(selectedCaregiver.id);
    } else {
      showToast('error', result.error || 'Failed to resend confirmation link');
    }
    setResendingId(null);
  };

  return (
    <div className="guarantor-override">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <h1>Guarantor Verification</h1>
            <p>View a caregiver's nominated guarantors and manually confirm one when the self-serve link isn't working</p>
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

      <div className="go-layout">
        {/* ── Left: caregiver picker ── */}
        <div className="go-panel go-panel--caregivers">
          <div className="go-panel-header">
            <h2>Caregivers</h2>
          </div>
          <div className="go-search-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {caregiversError && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <div><p>{caregiversError}</p></div>
            </div>
          )}

          {loadingCaregivers ? (
            <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : visibleCaregivers.length === 0 ? (
            <div className="pkg-empty"><i className="fas fa-inbox"></i><p>No caregivers found</p></div>
          ) : (
            <ul className="go-caregiver-list">
              {visibleCaregivers.map((c) => (
                <li
                  key={c.id}
                  className={`go-caregiver-item${selectedCaregiver?.id === c.id ? ' go-caregiver-item--active' : ''}`}
                  onClick={() => selectCaregiver(c)}
                >
                  <strong>{c.firstName} {c.lastName}</strong>
                  <span>{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right: guarantors for selected caregiver ── */}
        <div className="go-panel go-panel--guarantors">
          {!selectedCaregiver ? (
            <div className="pkg-empty">
              <i className="fas fa-hand-point-left"></i>
              <p>Select a caregiver to see their guarantors</p>
            </div>
          ) : (
            <>
              <div className="go-panel-header">
                <h2>Guarantors for {selectedCaregiver.firstName} {selectedCaregiver.lastName}</h2>
                <button className="go-btn-secondary btn-sm" onClick={() => loadGuarantors(selectedCaregiver.id)} disabled={loadingGuarantors}>
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
              </div>

              {guarantorsError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{guarantorsError}</p></div>
                </div>
              )}

              {loadingGuarantors ? (
                <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
              ) : guarantors.length === 0 ? (
                <div className="pkg-empty"><i className="fas fa-user-slash"></i><p>This caregiver hasn't nominated any guarantors yet</p></div>
              ) : (
                <ul className="go-guarantor-list">
                  {guarantors.map((g) => {
                    const isConfirmed = g.status === 'confirmed';
                    return (
                      <li key={g.id} className="go-guarantor-card">
                        <div className="go-guarantor-top">
                          <div>
                            <strong>{g.name}</strong>
                            <span className="go-relationship">{g.relationshipToCaregiver}</span>
                          </div>
                          <span className={`pkg-badge ${isConfirmed ? 'pkg-badge--active' : 'pkg-badge--inactive'}`}>
                            {isConfirmed ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>

                        <div className="go-guarantor-contact">
                          <span><i className="fas fa-phone"></i> {g.phoneNo}</span>
                          <span><i className="fas fa-envelope"></i> {g.email}</span>
                          <span><i className="fas fa-map-marker-alt"></i> {g.address}</span>
                        </div>

                        {isConfirmed && (
                          <div className="go-attribution">
                            <span className={`pkg-badge pkg-badge--type`}>
                              {g.confirmationMethod === 'staff_override' ? 'Staff override' : 'Self-serve link'}
                            </span>
                            <span className="go-attribution-detail">Confirmed {fmtDate(g.verifiedAt)}</span>
                            {g.confirmationMethod === 'staff_override' && g.confirmedByAdminEmail && (
                              <span className="go-attribution-detail">by {g.confirmedByAdminEmail}</span>
                            )}
                          </div>
                        )}

                        {!isConfirmed && (
                          <div className="go-guarantor-meta">
                            <span>Attempts: {g.attemptCount ?? 0}</span>
                            {g.lastAttemptAt && <span>Last sent: {fmtDate(g.lastAttemptAt)}</span>}
                          </div>
                        )}

                        <div className="go-guarantor-actions">
                          {!isConfirmed && (
                            <button
                              className="go-btn-secondary btn-sm"
                              onClick={() => handleResend(g)}
                              disabled={resendingId === g.id}
                            >
                              {resendingId === g.id
                                ? <><i className="fas fa-spinner fa-spin"></i> Resending…</>
                                : <><i className="fas fa-paper-plane"></i> Resend Link</>}
                            </button>
                          )}
                          <button className="go-btn-primary btn-sm" onClick={() => openConfirm(g)}>
                            <i className="fas fa-check"></i> {isConfirmed ? 'Confirm (already done)' : 'Confirm Manually'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MANUAL CONFIRM MODAL ── */}
      {confirmTarget && (
        <div className="pkg-modal-overlay" onClick={closeConfirm}>
          <div className="pkg-modal pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2><i className="fas fa-check"></i> Confirm Guarantor</h2>
              <button className="pkg-modal-close" onClick={closeConfirm}><i className="fas fa-times"></i></button>
            </div>
            <div className="pkg-modal-body">
              {confirmTarget.status === 'confirmed' && (
                <div className="alert alert-error" style={{ background: '#fff8e1', borderColor: '#ffe0a3', color: '#8a6d1f' }}>
                  <i className="fas fa-info-circle"></i>
                  <div><p>
                    {confirmTarget.name} is already confirmed (via {confirmTarget.confirmationMethod || 'unknown'}).
                    Submitting here is a safe no-op — it will not change their status or attribution.
                  </p></div>
                </div>
              )}
              <p>
                Manually confirm <strong>{confirmTarget.name}</strong> ({confirmTarget.relationshipToCaregiver}) for{' '}
                <strong>{selectedCaregiver?.firstName} {selectedCaregiver?.lastName}</strong>? Use this when the
                self-serve link bounced or you verified them by phone instead.
              </p>
              <div className="form-group">
                <label htmlFor="go-reason">Reason <span className="required">*</span></label>
                <textarea
                  id="go-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Confirmation email bounced twice, verified guarantor by phone instead"
                />
                {reasonTooShort && (
                  <p className="go-field-error">
                    {MIN_REASON_LENGTH - reason.trim().length} more character{MIN_REASON_LENGTH - reason.trim().length !== 1 ? 's' : ''} needed.
                  </p>
                )}
              </div>
              {confirmError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{confirmError}</p></div>
                </div>
              )}
              <div className="form-actions">
                <button className="go-btn-secondary" onClick={closeConfirm} disabled={confirming}>Cancel</button>
                <button className="go-btn-primary" onClick={handleConfirmSubmit} disabled={confirming || !canSubmitConfirm}>
                  {confirming
                    ? <><i className="fas fa-spinner fa-spin"></i> Confirming…</>
                    : <><i className="fas fa-check"></i> Confirm</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuarantorOverride;
