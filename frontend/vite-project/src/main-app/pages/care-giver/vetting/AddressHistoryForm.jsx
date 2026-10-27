import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService from '../../../services/caregiverVettingService';
import addressProofService, { BILL_ACCEPT, validateBillFile } from '../../../services/addressProofService';
import './vetting.css';

const EMPTY_FORM = { address: '', movedIn: '', movedOut: '', isCurrent: false };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

// Today's calendar date in Lagos as yyyy-mm-dd (the server applies the bill-age rule on the Lagos date too).
const lagosToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());

// yyyy-mm-dd minus N calendar months, clamping the day like the server's AddMonths does.
const monthsBefore = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) - n;
  const ty = Math.floor(total / 12);
  const tm = total % 12;
  const last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
};

const PROOF_LABEL = { none: 'Bill needed', pending: 'Bill under review', approved: 'Bill approved', rejected: 'Bill rejected' };

const AddressHistoryForm = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const [records, setRecords] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [recResult, covResult] = await Promise.all([
      caregiverVettingService.getAddressHistory(),
      caregiverVettingService.getAddressHistoryCoverage(),
    ]);
    if (recResult.success) setRecords(recResult.data || []);
    else showToast('error', recResult.error);
    if (covResult.success) setCoverage(covResult.data);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ── Add / edit modal ──────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | record
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget('new');
  };

  const openEdit = (r) => {
    setForm({
      address: r.address || '',
      movedIn: r.movedIn ? r.movedIn.slice(0, 10) : '',
      movedOut: r.movedOut ? r.movedOut.slice(0, 10) : '',
      isCurrent: !r.movedOut,
    });
    setFormError(null);
    setEditTarget(r);
  };

  const closeModal = () => {
    if (saving) return;
    setEditTarget(null);
  };

  const dateOrderInvalid = !form.isCurrent && form.movedOut && form.movedIn && form.movedOut < form.movedIn;
  const canSubmitForm = form.address.trim().length >= 2 && !!form.movedIn && !dateOrderInvalid;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      address: form.address.trim(),
      movedIn: form.movedIn,
      movedOut: form.isCurrent ? null : (form.movedOut || null),
    };
    const result = editTarget === 'new'
      ? await caregiverVettingService.addAddressHistory(payload)
      : await caregiverVettingService.updateAddressHistory(editTarget.id, payload);

    if (result.success) {
      showToast('success', editTarget === 'new' ? 'Address added.' : 'Address updated.');
      setEditTarget(null);
      loadAll();
    } else {
      setFormError(result.error);
    }
    setSaving(false);
  };

  // ── Proof of current address (power-holding / NEPA bill) ───────────
  const fileInput = useRef(null);
  const [proofTarget, setProofTarget] = useState(null); // address record being proven
  const [billDate, setBillDate] = useState('');
  const [nameOnBill, setNameOnBill] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofError, setProofError] = useState(null);
  const [preview, setPreview] = useState(null); // { url, type, name }
  const previewUrlRef = useRef(null);
  // Revoke the blob URL only on close/unmount (an effect keyed on `preview` would revoke it straight away under StrictMode).
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const lagosDay = lagosToday();
  const maxBillAge = proofTarget?.proof?.maxBillAgeMonths || 3;
  const oldestBill = useMemo(() => monthsBefore(lagosDay, maxBillAge), [lagosDay, maxBillAge]);

  const openProof = (r) => {
    setProofTarget(r);
    setBillDate('');
    setNameOnBill('');
    setBillFile(null);
    setProofError(null);
  };
  const closeProof = () => { if (!proofSubmitting) setProofTarget(null); };

  const billFileError = billFile ? validateBillFile(billFile) : null;
  const billTooOld = billDate && billDate < oldestBill;
  const billInFuture = billDate && billDate > lagosDay;
  const canSubmitProof = !!proofTarget && !proofSubmitting && billDate && !billTooOld && !billInFuture
    && nameOnBill.trim().length >= 2 && !!billFile && !billFileError;

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitProof) return;
    setProofSubmitting(true);
    setProofError(null);
    const result = await addressProofService.submit(proofTarget.id, { billDate, nameOnBill: nameOnBill.trim(), file: billFile });
    setProofSubmitting(false);
    if (result.success) {
      setProofTarget(null);
      showToast('success', 'Bill submitted. Our team will review it and let you know.');
      loadAll();
    } else {
      setProofError(result.error);
    }
  };

  const openBill = async (r) => {
    const result = await addressProofService.fetchFile(r.id);
    if (!result.success) { showToast('error', result.error); return; }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(result.data);
    setPreview({ url: previewUrlRef.current, type: result.data.type, name: 'Your bill' });
  };
  const closePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (r) => {
    if (!window.confirm('Remove this address entry?')) return;
    setDeletingId(r.id);
    const result = await caregiverVettingService.deleteAddressHistory(r.id);
    if (result.success) {
      showToast('success', 'Address removed.');
      loadAll();
    } else {
      showToast('error', result.error);
    }
    setDeletingId(null);
  };

  const isComplete = !!coverage?.isComplete;
  const awaitingReview = coverage?.state === 'awaiting_review';
  const datesCovered = !!coverage?.datesCovered;
  const hasCurrent = records.some((r) => !r.movedOut);
  const proofRequired = !!coverage?.proofRequired;
  const currentApproved = records.some((r) => !r.movedOut && r.proof?.status === 'approved');
  const requiredFrom = coverage?.proofEnforcementDate
    ? new Date(coverage.proofEnforcementDate).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const requiredCount = coverage?.requiredCount ?? 2;
  const requiredYears = coverage?.requiredYears ?? 5;
  const recordCount = coverage?.recordCount ?? records.length;
  const progressPct = datesCovered && !isComplete ? 90 : Math.min(100, Math.round((recordCount / requiredCount) * 100));

  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-home"></i> Address History</h1>
        <p>Submit where you've lived, covering the last {requiredYears} years, and upload a recent power-holding (NEPA) bill for the address you live at now{coverage && !coverage.proofRequired ? ' (optional for now)' : ''}.</p>
      </div>

      {toast && (
        <div className={`vet-alert vet-alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="vet-alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {!loading && coverage && (
        <div className="vet-panel">
          <div className="vet-panel-header">
            <h2>
              Coverage status:{' '}
              <span className={`vet-pkg-badge ${isComplete ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`} data-testid="ah-coverage-badge">
                {isComplete ? 'Complete' : awaitingReview ? 'Under review' : 'Incomplete'}
              </span>
            </h2>
          </div>
          <div className="vet-progress-track">
            <div className={`vet-progress-fill${isComplete ? ' vet-progress-fill--complete' : ''}`} style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="vet-explainer">
            {isComplete ? (
              <>
                <i className="fas fa-check-circle" style={{ color: '#2e7d32' }}></i>{' '}
                Your {recordCount} address record{recordCount === 1 ? '' : 's'} give{recordCount === 1 ? 's' : ''} contiguous coverage
                for the last {requiredYears} years{proofRequired ? ' and your current address has been confirmed' : ''}. Nothing more needed here.
                {!proofRequired && !currentApproved && (
                  <span data-testid="ah-upcoming-note">
                    {' '}Heads up: a power-holding (NEPA) bill for your current address will be required{requiredFrom ? ` from ${requiredFrom}` : ' soon'} —
                    you can upload yours now so you're ready.
                  </span>
                )}
              </>
            ) : awaitingReview ? (
              <>
                <i className="fas fa-hourglass-half"></i>{' '}
                Your addresses cover the last {requiredYears} years. We're reviewing the bill you uploaded for your current address —
                you'll be notified as soon as there's a decision.
              </>
            ) : datesCovered && !hasCurrent ? (
              <>
                <i className="fas fa-info-circle"></i>{' '}
                Your addresses cover the last {requiredYears} years, but none is marked as where you live now. Edit your latest address and tick
                "I currently live here", then upload a power-holding (NEPA) bill for it.
              </>
            ) : datesCovered ? (
              <>
                <i className="fas fa-info-circle"></i>{' '}
                Your addresses cover the last {requiredYears} years. One more step: upload a recent power-holding (NEPA) bill for the
                address you live at now so our team can confirm it.
              </>
            ) : (
              <>
                <i className="fas fa-info-circle"></i>{' '}
                We need at least {requiredCount} address records that together cover the last {requiredYears} years
                with no gaps longer than about a month between one address ending and the next starting, right up
                to today. You currently have {recordCount} record{recordCount === 1 ? '' : 's'}
                {recordCount > 0 ? ' — check the dates below line up with no gaps, and that your most recent entry has no "moved out" date if you still live there.' : '.'}
              </>
            )}
          </div>
        </div>
      )}

      <div className="vet-panel">
        <div className="vet-panel-header">
          <h2>Your addresses</h2>
          <button className="vet-btn-primary vet-btn-sm" onClick={openAdd}>
            <i className="fas fa-plus"></i> Add Address
          </button>
        </div>

        {loading ? (
          <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>
        ) : records.length === 0 ? (
          <div className="vet-pkg-empty"><i className="fas fa-map-marker-alt"></i><p>No address history yet.</p></div>
        ) : (
          <ul className="vet-list">
            {records
              .slice()
              .sort((a, b) => new Date(b.movedIn) - new Date(a.movedIn))
              .map((r) => (
                <li key={r.id} className="vet-item">
                  <div className="vet-item-top">
                    <div>
                      <strong>{r.address}</strong>
                      <span className="vet-item-sub">
                        {fmtDate(r.movedIn)} — {r.movedOut ? fmtDate(r.movedOut) : 'Present'}
                      </span>
                    </div>
                    {!r.movedOut && <span className="vet-pkg-badge vet-pkg-badge--active">Current</span>}
                  </div>
                  {r.proof?.required && (
                    <div className={`ap-proof ap-proof--${r.proof.status}`} data-testid="ah-proof" data-status={r.proof.status}>
                      <div className="ap-proof-head">
                        <strong><i className="fas fa-bolt"></i> Proof of address</strong>
                        <span className={`vet-pkg-badge ${r.proof.status === 'approved' ? 'vet-pkg-badge--active' : r.proof.status === 'rejected' ? 'vet-pkg-badge--danger' : 'vet-pkg-badge--inactive'}`}>
                          {r.proof.status === 'none' && !r.proof.enforced ? 'Optional for now' : (PROOF_LABEL[r.proof.status] || r.proof.status)}
                        </span>
                      </div>
                      {r.proof.status === 'none' && (
                        <p>
                          Upload a recent power-holding (NEPA) bill showing this address so our team can confirm you live here.
                          {!r.proof.enforced && ' This is optional for now.'}
                        </p>
                      )}
                      {r.proof.status === 'pending' && (
                        <p data-testid="ah-proof-pending">Submitted {fmtDate(r.proof.submittedAt)} — under review. We'll notify you of the decision.</p>
                      )}
                      {r.proof.status === 'approved' && (
                        <p data-testid="ah-proof-approved">Approved{r.proof.reviewedAt ? ` on ${fmtDate(r.proof.reviewedAt)}` : ''}. Changing this address or the move-in date will remove the approval.</p>
                      )}
                      {r.proof.status === 'rejected' && (
                        <p className="ap-proof-reason" data-testid="ah-proof-rejected">Not approved: {r.proof.rejectionReason || 'please upload a clearer, recent bill.'}</p>
                      )}
                      <div className="ap-proof-actions">
                        {r.proof.canSubmit && (
                          <button className="vet-btn-primary vet-btn-sm" onClick={() => openProof(r)} data-testid="ah-proof-upload">
                            <i className="fas fa-upload"></i> {r.proof.status === 'rejected' ? 'Upload a new bill' : 'Upload bill'}
                          </button>
                        )}
                        {r.proof.status !== 'none' && (
                          <button className="vet-btn-secondary vet-btn-sm" onClick={() => openBill(r)} data-testid="ah-proof-view">
                            <i className="fas fa-eye"></i> View bill
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="vet-item-actions">
                    <button className="vet-btn-secondary vet-btn-sm" onClick={() => openEdit(r)}>
                      <i className="fas fa-pen"></i> Edit
                    </button>
                    <button
                      className="vet-btn-danger vet-btn-sm"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id
                        ? <><i className="fas fa-vet-spinner fa-spin"></i> Removing…</>
                        : <><i className="fas fa-trash"></i> Remove</>}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {editTarget && (
        <div className="vet-pkg-modal-overlay" onClick={closeModal}>
          <div className="vet-pkg-modal vet-pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="vet-pkg-modal-header">
              <h2><i className="fas fa-home"></i> {editTarget === 'new' ? 'Add Address' : 'Edit Address'}</h2>
              <button className="vet-pkg-modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="vet-pkg-modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="vet-form-group">
                  <label htmlFor="a-address">Address <span className="vet-required">*</span></label>
                  <textarea id="a-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="vet-form-row">
                  <div className="vet-form-group">
                    <label htmlFor="a-moved-in">Moved In <span className="vet-required">*</span></label>
                    <input id="a-moved-in" type="date" max={today} value={form.movedIn} onChange={(e) => setForm({ ...form, movedIn: e.target.value })} required />
                  </div>
                  <div className="vet-form-group">
                    <label htmlFor="a-moved-out">Moved Out</label>
                    <input
                      id="a-moved-out"
                      type="date"
                      max={today}
                      value={form.movedOut}
                      disabled={form.isCurrent}
                      onChange={(e) => setForm({ ...form, movedOut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="vet-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, movedOut: e.target.checked ? '' : form.movedOut })}
                      style={{ width: 'auto', marginRight: '0.5rem' }}
                    />
                    I currently live here
                  </label>
                </div>
                {editTarget && editTarget !== 'new' && editTarget.proof?.status && editTarget.proof.status !== 'none' && (
                  <p className="vet-form-hint" data-testid="ah-edit-warning">
                    <i className="fas fa-exclamation-triangle"></i> Changing the address or move-in date will remove the bill you uploaded for it,
                    and you'll need to upload it again.
                  </p>
                )}
                {dateOrderInvalid && (
                  <p className="vet-field-error">Move-out date can't be before the move-in date.</p>
                )}

                {formError && (
                  <div className="vet-alert vet-alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <div><p>{formError}</p></div>
                  </div>
                )}

                <div className="vet-form-actions">
                  <button type="button" className="vet-btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="vet-btn-primary" disabled={!canSubmitForm || saving}>
                    {saving
                      ? <><i className="fas fa-vet-spinner fa-spin"></i> Saving…</>
                      : <><i className="fas fa-check"></i> {editTarget === 'new' ? 'Add Address' : 'Save Changes'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {proofTarget && (
        <div className="vet-pkg-modal-overlay" onClick={closeProof}>
          <div className="vet-pkg-modal vet-pkg-modal--sm" onClick={(e) => e.stopPropagation()} data-testid="ah-proof-modal">
            <div className="vet-pkg-modal-header">
              <h2><i className="fas fa-bolt"></i> Upload your power-holding bill</h2>
              <button className="vet-pkg-modal-close" onClick={closeProof}><i className="fas fa-times"></i></button>
            </div>
            <div className="vet-pkg-modal-body">
              <ul className="ap-guidance">
                <li>Use a NEPA / electricity bill (or prepaid token receipt) for <strong>{proofTarget.address}</strong>.</li>
                <li>It must be dated within the last {maxBillAge} months.</li>
                <li>The address and account holder name must be clearly visible. Photos must not be cropped or edited.</li>
              </ul>
              <form onSubmit={handleProofSubmit}>
                <div className="vet-form-row">
                  <div className="vet-form-group">
                    <label htmlFor="ap-date">Date on the bill <span className="vet-required">*</span></label>
                    <input id="ap-date" type="date" min={oldestBill} max={lagosDay} value={billDate} onChange={(e) => setBillDate(e.target.value)} required />
                    {billTooOld && <p className="vet-field-error" data-testid="ah-bill-old">This bill is older than {maxBillAge} months. Please upload a recent one.</p>}
                    {billInFuture && <p className="vet-field-error">The bill date can't be in the future.</p>}
                  </div>
                  <div className="vet-form-group">
                    <label htmlFor="ap-name">Account holder name on the bill <span className="vet-required">*</span></label>
                    <input id="ap-name" type="text" maxLength={150} value={nameOnBill} onChange={(e) => setNameOnBill(e.target.value)} required />
                  </div>
                </div>
                <div className="vet-form-group">
                  <label htmlFor="ap-file">Bill file <span className="vet-required">*</span></label>
                  <input id="ap-file" ref={fileInput} type="file" accept={BILL_ACCEPT}
                    onChange={(e) => { setBillFile(e.target.files?.[0] || null); setProofError(null); }} data-testid="ah-bill-file" />
                  <p className="vet-form-hint">PDF, JPG or PNG, up to {proofTarget.proof?.maxFileSizeMB || 10} MB.</p>
                  {billFileError && <p className="vet-field-error" data-testid="ah-bill-file-error">{billFileError}</p>}
                </div>

                {proofError && (
                  <div className="vet-alert vet-alert-error" data-testid="ah-proof-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <div><p>{proofError}</p></div>
                  </div>
                )}

                <div className="vet-form-actions">
                  <button type="button" className="vet-btn-secondary" onClick={closeProof} disabled={proofSubmitting}>Cancel</button>
                  <button type="submit" className="vet-btn-primary" disabled={!canSubmitProof} data-testid="ah-proof-submit">
                    {proofSubmitting
                      ? <><i className="fas fa-vet-spinner fa-spin"></i> Uploading…</>
                      : <><i className="fas fa-check"></i> Submit for review</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="vet-pkg-modal-overlay" onClick={closePreview} role="dialog" data-testid="ah-preview">
          <div className="vet-pkg-modal ap-preview" onClick={(e) => e.stopPropagation()}>
            <div className="vet-pkg-modal-header">
              <h2>{preview.name}</h2>
              <button className="vet-pkg-modal-close" onClick={closePreview}>×</button>
            </div>
            <div className="vet-pkg-modal-body">
              {String(preview.type).startsWith('image/')
                ? <img src={preview.url} alt="Your bill" />
                : <iframe src={preview.url} title="Your bill" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressHistoryForm;
