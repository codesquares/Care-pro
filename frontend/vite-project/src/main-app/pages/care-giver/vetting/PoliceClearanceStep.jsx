import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import policeClearanceService, {
  CLEARANCE_ACCEPT,
  CLEARANCE_LIMITS,
  validateClearanceFiles,
} from '../../../services/policeClearanceService';
import { formatLagos } from '../../../utils/lagosTime';
import './vetting.css';
import './police-clearance.css';

// Today's calendar date in Lagos as yyyy-mm-dd (the server applies the age rule on the Lagos date too).
const lagosToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());

// yyyy-mm-dd minus N calendar months, clamping the day like the server's AddMonths does (31 Aug - 6 months = 28 Feb).
const monthsBefore = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) - n;
  const ty = Math.floor(total / 12);
  const tm = total % 12;
  const last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
};

const longDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
};

const prettySize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const STATUS_LABEL = {
  none: 'Not submitted',
  pending: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  revoked: 'Approval withdrawn',
};

const PoliceClearanceStep = () => {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [state, setState] = useState(null);

  const [issueDate, setIssueDate] = useState('');
  const [nameOnDocument, setNameOnDocument] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [preview, setPreview] = useState(null); // { url, type, name }

  const load = async () => {
    setLoading(true);
    const result = await policeClearanceService.getStatus();
    if (result.success) { setState(result.data); setLoadError(null); } else setLoadError(result.error);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  // Revoke the blob URL only when the preview is closed or the page unmounts (an effect keyed on `preview` would revoke it
  // straight away under React StrictMode's dev double-invoke).
  const previewUrlRef = useRef(null);
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  const today = lagosToday();
  const maxAgeMonths = state?.maxAgeMonths || 6;
  const oldestAllowed = useMemo(() => monthsBefore(today, maxAgeMonths), [today, maxAgeMonths]);

  const status = state?.status || 'none';
  const showForm = !!state && state.canResubmit;
  const fileError = files.length > 0 ? validateClearanceFiles(files) : null;
  const dateTooOld = issueDate && issueDate < oldestAllowed;
  const dateInFuture = issueDate && issueDate > today;
  const canSubmit = showForm && !submitting && issueDate && !dateTooOld && !dateInFuture
    && nameOnDocument.trim().length >= 2 && referenceNumber.trim().length >= 3 && files.length > 0 && !fileError;

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    // Several images may be added in separate picks; a PDF replaces the selection (it must be alone).
    const next = picked.some((f) => f.type === 'application/pdf') ? picked.slice(0, 1) : [...files.filter((f) => f.type !== 'application/pdf'), ...picked];
    setFiles(next);
    setFormError(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const removeFile = (idx) => setFiles((fs) => fs.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    const result = await policeClearanceService.submit({
      issueDate, nameOnDocument: nameOnDocument.trim(), referenceNumber: referenceNumber.trim(), files,
    });
    setSubmitting(false);
    if (result.success) {
      setState(result.data);
      setFiles([]);
      setJustSubmitted(true);
    } else {
      setFormError(result.error);
    }
  };

  const openFile = async (clearanceId, file) => {
    const result = await policeClearanceService.fetchFile(clearanceId, file.index);
    if (!result.success) { setFormError(result.error); return; }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(result.data);
    setPreview({ url: previewUrlRef.current, type: file.contentType || result.data.type, name: file.fileName });
  };

  const closePreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
  };

  const requirement = state?.enforced
    ? 'A police clearance approved by our team is required before you can accept or be assigned to clients.'
    : state?.enforcementDate
      ? `Required from ${formatLagos(state.enforcementDate).replace(/ at .*$/, '')}. Submit yours now so you're ready.`
      : 'This step will become required soon. Submit yours now so you are ready.';

  return (
    <div className="vet-page" data-testid="police-clearance-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-shield-alt"></i> Police Clearance</h1>
        <p>Upload a recent police clearance. Our Operations team reviews it before you are assigned to clients.</p>
      </div>

      {loading && <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>}
      {!loading && loadError && (
        <div className="vet-alert vet-alert-error"><i className="fas fa-exclamation-circle"></i><div><p>{loadError}</p></div></div>
      )}

      {!loading && state && (
        <>
          <div className={`vet-alert ${state.enforced && status !== 'approved' ? 'vet-alert-error' : 'vet-alert-info'}`} data-testid="pc-requirement">
            <i className="fas fa-info-circle"></i>
            <div><p>{requirement}</p></div>
          </div>

          <div className="vet-panel pc-status" data-testid="pc-status" data-status={status}>
            <div className="vet-panel-header">
              <h2>Status</h2>
              <span className={`vet-pkg-badge ${status === 'approved' ? 'vet-pkg-badge--active' : status === 'rejected' || status === 'revoked' ? 'vet-pkg-badge--danger' : 'vet-pkg-badge--inactive'}`}>
                {STATUS_LABEL[status]}
              </span>
            </div>

            {status === 'none' && <p className="vet-explainer">You haven't submitted a police clearance yet.</p>}

            {status === 'pending' && (
              <p className="vet-explainer" data-testid="pc-pending">
                We received your clearance{state.submittedAt ? ` on ${formatLagos(state.submittedAt)}` : ''} and our team is reviewing it. You'll
                be notified as soon as there's a decision. If you made a mistake you can replace it below.
              </p>
            )}

            {status === 'approved' && (
              <p className="vet-explainer" data-testid="pc-approved">
                Your police clearance was approved{state.reviewedAt ? ` on ${formatLagos(state.reviewedAt)}` : ''}. Nothing more is needed for this step.
              </p>
            )}

            {status === 'rejected' && (
              <div className="pc-reason pc-reason--bad" data-testid="pc-rejected">
                <strong>We couldn't approve this clearance.</strong>
                <p data-testid="pc-reason-text">{state.rejectionReason || 'No reason was recorded.'}</p>
                <p>Please upload a new one below.</p>
              </div>
            )}

            {status === 'revoked' && (
              <div className="pc-reason pc-reason--bad" data-testid="pc-revoked">
                <strong>The approval of your earlier clearance was withdrawn.</strong>
                <p data-testid="pc-reason-text">{state.revokedReason || 'No reason was recorded.'}</p>
                <p>Please upload a new one below.</p>
              </div>
            )}

            {status !== 'none' && (
              <dl className="pc-facts">
                {state.issueDate && (<><dt>Issue date</dt><dd>{longDate(state.issueDate)}</dd></>)}
                {state.nameOnDocument && (<><dt>Name on document</dt><dd>{state.nameOnDocument}</dd></>)}
                {state.referenceNumber && (<><dt>Reference number</dt><dd>{state.referenceNumber}</dd></>)}
              </dl>
            )}

            {state.files?.length > 0 && state.clearanceId && (
              <ul className="vet-list pc-files">
                {state.files.map((f) => (
                  <li key={f.index} className="vet-item">
                    <div className="vet-item-top">
                      <div><strong>{f.fileName || `File ${f.index + 1}`}</strong><span className="vet-item-sub">{prettySize(f.sizeBytes || 0)}</span></div>
                      <button type="button" className="vet-btn-secondary vet-btn-sm" onClick={() => openFile(state.clearanceId, f)}>
                        <i className="fas fa-eye"></i> View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {justSubmitted && status === 'pending' && (
            <div className="vet-alert vet-alert-success" data-testid="pc-submitted-toast">
              <i className="fas fa-check-circle"></i>
              <div><p>Submitted. Our team will review it and let you know.</p></div>
            </div>
          )}

          {showForm && (
            <form className="vet-panel" onSubmit={handleSubmit} data-testid="pc-form">
              <div className="vet-panel-header"><h2>{status === 'pending' ? 'Replace your submission' : 'Upload your police clearance'}</h2></div>

              <ul className="pc-guidance">
                <li>It must have been <strong>issued within the last {maxAgeMonths} months</strong> (on or after {longDate(`${oldestAllowed}T00:00:00Z`)}).</li>
                <li>Upload <strong>one PDF</strong>, or <strong>up to {CLEARANCE_LIMITS.maxFiles} clear photos/scans</strong> (JPG or PNG) if it has several pages.</li>
                <li>Each file up to 10 MB, 20 MB in total. Make sure every page is sharp and nothing is cropped.</li>
              </ul>

              <div className="vet-form-row">
                <div className="vet-form-group">
                  <label htmlFor="pc-issue">Issue date <span className="vet-required">*</span></label>
                  <input id="pc-issue" data-testid="pc-issue" type="date" value={issueDate} min={oldestAllowed} max={today}
                    onChange={(e) => { setIssueDate(e.target.value); setFormError(null); }} required />
                  {dateTooOld && <p className="vet-field-error" data-testid="pc-date-old">This clearance is older than {maxAgeMonths} months. Please upload a recent one.</p>}
                  {dateInFuture && <p className="vet-field-error">The issue date can't be in the future.</p>}
                </div>
                <div className="vet-form-group">
                  <label htmlFor="pc-ref">Reference number <span className="vet-required">*</span></label>
                  <input id="pc-ref" data-testid="pc-ref" type="text" value={referenceNumber} maxLength={80}
                    onChange={(e) => setReferenceNumber(e.target.value)} placeholder="As printed on the clearance" required />
                </div>
              </div>

              <div className="vet-form-group">
                <label htmlFor="pc-name">Your name exactly as it appears on the clearance <span className="vet-required">*</span></label>
                <input id="pc-name" data-testid="pc-name" type="text" value={nameOnDocument} maxLength={150}
                  onChange={(e) => setNameOnDocument(e.target.value)} required />
              </div>

              <div className="vet-form-group">
                <label htmlFor="pc-files">Files <span className="vet-required">*</span></label>
                <input id="pc-files" data-testid="pc-files" ref={fileInput} type="file" accept={CLEARANCE_ACCEPT} multiple onChange={onPickFiles} />
                <p className="vet-form-hint">PDF, JPG or PNG.</p>
                {files.length > 0 && (
                  <ul className="pc-picked" data-testid="pc-picked">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`}>
                        <span>{f.name} <small>({prettySize(f.size)})</small></span>
                        <button type="button" className="pc-remove" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
                {fileError && <p className="vet-field-error" data-testid="pc-file-error">{fileError}</p>}
              </div>

              {formError && (
                <div className="vet-alert vet-alert-error" data-testid="pc-error">
                  <i className="fas fa-exclamation-circle"></i><div><p>{formError}</p></div>
                </div>
              )}

              <div className="vet-form-actions">
                <button type="submit" className="vet-btn-primary" disabled={!canSubmit} data-testid="pc-submit">
                  {submitting ? 'Uploading…' : status === 'pending' ? 'Replace submission' : 'Submit for review'}
                </button>
              </div>
            </form>
          )}

          {state.history?.length > 1 && (
            <div className="vet-panel" data-testid="pc-history">
              <div className="vet-panel-header"><h2>History</h2></div>
              <ul className="vet-list">
                {state.history.map((h) => (
                  <li key={h.id} className="vet-item">
                    <div className="vet-item-top">
                      <div>
                        <strong>{STATUS_LABEL[h.status] || h.status}{h.superseded ? ' (replaced)' : ''}</strong>
                        <span className="vet-item-sub">
                          Submitted {h.submittedAt ? formatLagos(h.submittedAt) : '—'}
                          {h.reason ? ` · ${h.reason}` : ''}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="vet-pkg-modal-overlay" onClick={closePreview} role="dialog" data-testid="pc-preview">
          <div className="vet-pkg-modal pc-preview" onClick={(e) => e.stopPropagation()}>
            <div className="vet-pkg-modal-header">
              <h3>{preview.name}</h3>
              <button className="vet-pkg-modal-close" onClick={closePreview}>×</button>
            </div>
            <div className="vet-pkg-modal-body">
              {String(preview.type).startsWith('image/')
                ? <img src={preview.url} alt={preview.name} />
                : <iframe src={preview.url} title={preview.name} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliceClearanceStep;
