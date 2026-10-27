import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminGuarantorService from '../../../services/adminGuarantorService';
import adminService from '../../../services/adminService';
import {
  GUARANTOR_RELATIONSHIP_CATEGORIES,
  GUARANTOR_LAST_CONTACT_OPTIONS,
  GUARANTOR_TRUST_OPTIONS,
} from '../../../services/caregiverVettingService';
import './guarantor-override.css';

const MIN_REASON_LENGTH = 5;

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const labelFor = (options, value) => options.find((o) => o.value === value)?.label || value || '—';

const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'pkg-badge--inactive' },
  needs_review: { label: 'Needs review', cls: 'pkg-badge--review' },
  confirmed: { label: 'Confirmed', cls: 'pkg-badge--active' },
  rejected: { label: 'Rejected', cls: 'pkg-badge--rejected' },
};

const CONFIRMATION_LABEL = {
  staff_override: 'Staff override',
  staff_review: 'Approved after review',
  self_serve: 'Self-serve link',
};

// Which comparison row each auto-check flag belongs to.
const FLAG_ROW = {
  name_mismatch: 'name',
  relationship_mismatch: 'relationship',
  years_mismatch: 'years',
  years_below_minimum: 'years',
  stale_contact: 'contact',
  trust_reservation: 'trust',
  phone_mismatch: 'phone',
  no_declared_data: 'declared',
};

const FLAG_TEXT = {
  name_mismatch: "The name the guarantor typed doesn't match the caregiver's account name.",
  relationship_mismatch: 'The guarantor chose a different relationship than the caregiver declared.',
  years_mismatch: "The years known differ from the caregiver's claim by more than 2.",
  years_below_minimum: 'The guarantor says they have known the caregiver for under 2 years.',
  stale_contact: 'The guarantor last saw or spoke to the caregiver over a year ago.',
  trust_reservation: 'The guarantor has reservations about the caregiver caring for a vulnerable person.',
  phone_mismatch: "The phone number the guarantor typed doesn't match the one the caregiver gave.",
  no_declared_data: 'This guarantor was added before the questionnaire existed, so there is nothing declared to compare against.',
};

// Side-by-side declared-vs-said rows for one guarantor. `flagged` marks rows an auto-check failed on.
const buildComparison = (g, caregiverName) => {
  const flagged = new Set((g.reviewFlags || []).map((f) => FLAG_ROW[f]));
  return [
    { key: 'name', label: 'Caregiver name', declared: caregiverName || '—', said: g.respCaregiverName || '—' },
    {
      key: 'relationship',
      label: 'Relationship',
      declared: g.relationshipCategory ? labelFor(GUARANTOR_RELATIONSHIP_CATEGORIES, g.relationshipCategory) : '—',
      said: labelFor(GUARANTOR_RELATIONSHIP_CATEGORIES, g.respRelationshipCategory),
    },
    {
      key: 'years',
      label: 'Years known',
      declared: g.yearsKnown != null ? String(g.yearsKnown) : '—',
      said: g.respYearsKnown != null ? String(g.respYearsKnown) : '—',
    },
    { key: 'contact', label: 'Last contact', declared: null, said: labelFor(GUARANTOR_LAST_CONTACT_OPTIONS, g.respLastContact) },
    { key: 'area', label: 'Where they say the caregiver lives', declared: null, said: g.respCaregiverArea || '—', note: 'Not auto-checked — compare by eye' },
    { key: 'phone', label: 'Guarantor phone', declared: g.phoneNo || '—', said: g.respPhoneNo || 'Not given' },
    {
      key: 'trust',
      label: 'Trust with a vulnerable person',
      declared: null,
      said: labelFor(GUARANTOR_TRUST_OPTIONS, g.respTrustAnswer) + (g.respTrustExplanation ? ` — "${g.respTrustExplanation}"` : ''),
    },
  ].map((r) => ({ ...r, flagged: flagged.has(r.key) }));
};
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

  // ─── Review queue (guarantors whose questionnaire was flagged) ───
  const [queue, setQueue] = useState([]);

  const loadQueue = useCallback(async () => {
    const result = await AdminGuarantorService.getNeedsReview();
    if (result.success) setQueue(Array.isArray(result.data) ? result.data : []);
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

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

  // ─── Review decision modal (approve / reject a needs_review guarantor) ───
  const [reviewTarget, setReviewTarget] = useState(null); // { guarantor, decision }
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const openReview = (guarantor, decision) => {
    setReviewTarget({ guarantor, decision });
    setReviewNote('');
    setReviewError(null);
  };

  const closeReview = () => {
    if (reviewing) return;
    setReviewTarget(null);
  };

  const canSubmitReview = reviewNote.trim().length >= MIN_REASON_LENGTH;

  const handleReviewSubmit = async () => {
    if (!reviewTarget || !canSubmitReview) return;
    setReviewing(true);
    setReviewError(null);
    const { guarantor, decision } = reviewTarget;
    const result = await AdminGuarantorService.reviewGuarantor(guarantor.id, decision, reviewNote.trim());
    if (result.success) {
      showToast('success', decision === 'approve' ? `${guarantor.name} approved.` : `${guarantor.name} rejected.`);
      setReviewTarget(null);
      loadQueue();
      if (selectedCaregiver) loadGuarantors(selectedCaregiver.id);
    } else {
      setReviewError(result.error || 'Failed to record the decision');
    }
    setReviewing(false);
  };

  // Open a queued guarantor's caregiver in the right-hand panel.
  const openQueued = useCallback((item) => {
    const known = caregivers.find((c) => c.id === item.caregiverId);
    selectCaregiver(known || { id: item.caregiverId, firstName: item.caregiverName, lastName: '', email: '' });
  }, [caregivers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link from the admin alert (?guarantor=<id>): open that guarantor's caregiver once the queue loads.
  const [searchParams] = useSearchParams();
  const deepLinkedGuarantor = searchParams.get('guarantor');
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  useEffect(() => {
    if (!deepLinkedGuarantor || deepLinkHandled || queue.length === 0) return;
    const item = queue.find((q) => q.id === deepLinkedGuarantor);
    if (item) openQueued(item);
    setDeepLinkHandled(true);
  }, [deepLinkedGuarantor, deepLinkHandled, queue, openQueued]);

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
          {queue.length > 0 && (
            <div className="go-queue">
              <h3><i className="fas fa-hourglass-half"></i> Awaiting review ({queue.length})</h3>
              <ul>
                {queue.map((item) => (
                  <li
                    key={item.id}
                    className={`go-queue-item${selectedCaregiver?.id === item.caregiverId ? ' go-queue-item--active' : ''}`}
                    onClick={() => openQueued(item)}
                  >
                    <strong>{item.caregiverName || 'Caregiver'}</strong>
                    <span>{item.name} · {fmtDate(item.responsesSubmittedAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                    const isNeedsReview = g.status === 'needs_review';
                    const isPending = g.status === 'pending';
                    const badge = STATUS_BADGE[g.status] || STATUS_BADGE.pending;
                    const hasAnswers = !!g.responsesSubmittedAt;
                    const caregiverName = `${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`.trim();
                    return (
                      <li key={g.id} className="go-guarantor-card">
                        <div className="go-guarantor-top">
                          <div>
                            <strong>{g.name}</strong>
                            <span className="go-relationship">{g.relationshipToCaregiver}</span>
                          </div>
                          <span className={`pkg-badge ${badge.cls}`}>{badge.label}</span>
                        </div>

                        <div className="go-guarantor-contact">
                          <span><i className="fas fa-phone"></i> {g.phoneNo}</span>
                          <span><i className="fas fa-envelope"></i> {g.email}</span>
                          <span><i className="fas fa-map-marker-alt"></i> {g.address}</span>
                        </div>

                        {isConfirmed && (
                          <div className="go-attribution">
                            <span className={`pkg-badge pkg-badge--type`}>
                              {CONFIRMATION_LABEL[g.confirmationMethod] || 'Self-serve link'}
                            </span>
                            <span className="go-attribution-detail">Confirmed {fmtDate(g.verifiedAt)}</span>
                            {g.confirmationMethod === 'staff_override' && g.confirmedByAdminEmail && (
                              <span className="go-attribution-detail">by {g.confirmedByAdminEmail}</span>
                            )}
                            {g.confirmationMethod === 'staff_review' && g.reviewedByAdminEmail && (
                              <span className="go-attribution-detail">by {g.reviewedByAdminEmail}</span>
                            )}
                          </div>
                        )}

                        {g.status === 'rejected' && (
                          <div className="go-attribution">
                            <span className="go-attribution-detail">
                              Rejected {fmtDate(g.reviewedAt)}{g.reviewedByAdminEmail ? ` by ${g.reviewedByAdminEmail}` : ''}
                            </span>
                          </div>
                        )}

                        {hasAnswers && (
                          <div className="go-answers">
                            <h4>Guarantor's answers <small>submitted {fmtDate(g.responsesSubmittedAt)}</small></h4>
                            {(g.reviewFlags || []).length > 0 && (
                              <ul className="go-flags">
                                {g.reviewFlags.map((f) => <li key={f}><i className="fas fa-flag"></i> {FLAG_TEXT[f] || f}</li>)}
                              </ul>
                            )}
                            <table className="go-compare">
                              <thead><tr><th></th><th>Caregiver declared</th><th>Guarantor said</th></tr></thead>
                              <tbody>
                                {buildComparison(g, caregiverName).map((r) => (
                                  <tr key={r.key} className={r.flagged ? 'go-compare-row--flag' : ''}>
                                    <th scope="row">{r.label}{r.note && <small>{r.note}</small>}</th>
                                    <td>{r.declared ?? '—'}</td>
                                    <td>{r.said}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <p className="go-howknow-label">How they know the caregiver</p>
                            <blockquote className="go-howknow">{g.respHowTheyKnow}</blockquote>
                            {g.reviewNote && (
                              <p className="go-review-note"><strong>Review note:</strong> {g.reviewNote}</p>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <div className="go-guarantor-meta">
                            <span>Attempts: {g.attemptCount ?? 0}</span>
                            {g.lastAttemptAt && <span>Last sent: {fmtDate(g.lastAttemptAt)}</span>}
                          </div>
                        )}

                        <div className="go-guarantor-actions">
                          {isNeedsReview && (
                            <>
                              <button className="go-btn-primary btn-sm" onClick={() => openReview(g, 'approve')}>
                                <i className="fas fa-thumbs-up"></i> Approve
                              </button>
                              <button className="go-btn-danger btn-sm" onClick={() => openReview(g, 'reject')}>
                                <i className="fas fa-thumbs-down"></i> Reject
                              </button>
                            </>
                          )}
                          {isPending && (
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

      {/* ── REVIEW DECISION MODAL ── */}
      {reviewTarget && (
        <div className="pkg-modal-overlay" onClick={closeReview}>
          <div className="pkg-modal pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2>
                <i className={`fas fa-${reviewTarget.decision === 'approve' ? 'thumbs-up' : 'thumbs-down'}`}></i>{' '}
                {reviewTarget.decision === 'approve' ? 'Approve guarantor' : 'Reject guarantor'}
              </h2>
              <button className="pkg-modal-close" onClick={closeReview}><i className="fas fa-times"></i></button>
            </div>
            <div className="pkg-modal-body">
              <p>
                {reviewTarget.decision === 'approve'
                  ? <>Approving <strong>{reviewTarget.guarantor.name}</strong> counts them as a confirmed guarantor.</>
                  : <>Rejecting <strong>{reviewTarget.guarantor.name}</strong> tells the caregiver to remove them and add someone else.</>}
              </p>
              <div className="form-group">
                <label htmlFor="go-review-note">Note <span className="required">*</span></label>
                <textarea
                  id="go-review-note"
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={reviewTarget.decision === 'approve'
                    ? 'e.g. Called the guarantor — goes by a nickname, relationship confirmed'
                    : 'e.g. Could not reach the guarantor and the answers do not match'}
                />
              </div>
              {reviewError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{reviewError}</p></div>
                </div>
              )}
              <div className="form-actions">
                <button className="go-btn-secondary" onClick={closeReview} disabled={reviewing}>Cancel</button>
                <button
                  className={reviewTarget.decision === 'approve' ? 'go-btn-primary' : 'go-btn-danger'}
                  onClick={handleReviewSubmit}
                  disabled={reviewing || !canSubmitReview}
                >
                  {reviewing
                    ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                    : reviewTarget.decision === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
