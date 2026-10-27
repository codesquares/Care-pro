import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminPoliceClearanceService, { CHECKLIST_ITEMS } from '../../../services/adminPoliceClearanceService';
import { formatLagos } from '../../../utils/lagosTime';
import './police-clearances.css';

export const COUNT_CHANGED_EVENT = 'police-clearance-count-changed';

const STATUS_LABEL = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected', revoked: 'Revoked' };
const MIN_REASON = 5;

const longDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
};

const EMPTY_CHECKLIST = {
  nameMatchesProfile: false, issuedByNigeriaPoliceForce: false, issueDateWithinAllowedAge: false,
  referenceNumberCaptured: false, scanLegibleAndUnaltered: false,
};

const PoliceClearances = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('clearance');

  const [status, setStatus] = useState(focusId ? 'all' : 'pending');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openId, setOpenId] = useState(focusId || null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminPoliceClearanceService.list({ status, search });
    if (result.success) { setRows(result.data.items || []); setTotal(result.data.totalCount || 0); } else setError(result.error);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const closeDetail = () => {
    setOpenId(null);
    if (searchParams.get('clearance')) { searchParams.delete('clearance'); setSearchParams(searchParams, { replace: true }); }
  };

  const afterDecision = () => {
    window.dispatchEvent(new Event(COUNT_CHANGED_EVENT));
    load();
  };

  return (
    <div className="pcr-page" data-testid="pcr-page">
      <h1>Police Clearances</h1>
      <p className="pcr-sub">
        Review each caregiver's latest police clearance. Opening a file is recorded in the audit log. Approving requires every
        checklist item; rejecting or revoking requires a reason, which the caregiver receives.
      </p>

      <div className="pcr-filters">
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="pcr-status-filter">
            <option value="pending">Pending review</option>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revoked">Revoked</option>
          </select>
        </label>
        <label>Search caregiver
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" data-testid="pcr-search" />
        </label>
        <button type="button" className="pcr-btn pcr-btn--ghost" onClick={load}>Refresh</button>
        <span className="pcr-count">{total} result{total === 1 ? '' : 's'} · oldest first</span>
      </div>

      {error && <p className="pcr-error">{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? (
        <p data-testid="pcr-empty">{status === 'pending' ? 'Nothing is waiting for review.' : 'No clearances match these filters.'}</p>
      ) : (
        <table className="pcr-table" data-testid="pcr-table">
          <thead><tr><th>Caregiver</th><th>Name on document</th><th>Reference</th><th>Issued</th><th>Submitted (WAT)</th><th>Files</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-clearance={r.id} data-status={r.status} className={focusId === r.id ? 'pcr-row--focus' : ''}>
                <td>{r.caregiverName}<br /><small>{r.caregiverEmail}</small></td>
                <td>{r.nameOnDocument || '—'}</td>
                <td>{r.referenceNumber || '—'}</td>
                <td>{longDate(r.issueDate)}</td>
                <td>{r.submittedAt ? formatLagos(r.submittedAt) : '—'}</td>
                <td>{r.fileCount}</td>
                <td><span className={`pcr-chip pcr-chip--${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                <td><button type="button" className="pcr-btn" onClick={() => setOpenId(r.id)} data-testid="pcr-review">{r.status === 'pending' ? 'Review' : 'Open'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openId && <ClearanceDetail key={openId} id={openId} onClose={closeDetail} onDecided={afterDecision} />}
    </div>
  );
};

const ClearanceDetail = ({ id, onClose, onDecided }) => {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [viewer, setViewer] = useState({ loading: false, error: null, url: null, type: null });
  const cache = useRef(new Map()); // index -> { url, type }  (so switching tabs doesn't re-open — and re-audit — a file)

  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState(null); // null | 'reject' | 'revoke'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await adminPoliceClearanceService.detail(id);
    if (result.success) { setDetail(result.data); setError(null); } else setError(result.error);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // Revoke object URLs when the panel closes.
  useEffect(() => () => { cache.current.forEach((v) => URL.revokeObjectURL(v.url)); cache.current.clear(); }, []);

  const showFile = useCallback(async (index) => {
    setFileIndex(index);
    const hit = cache.current.get(index);
    if (hit) { setViewer({ loading: false, error: null, url: hit.url, type: hit.type }); return; }
    setViewer({ loading: true, error: null, url: null, type: null });
    const result = await adminPoliceClearanceService.fetchFile(id, index);
    if (!result.success) { setViewer({ loading: false, error: result.error, url: null, type: null }); return; }
    const entry = { url: URL.createObjectURL(result.data), type: result.data.type };
    cache.current.set(index, entry);
    setViewer({ loading: false, error: null, url: entry.url, type: entry.type });
  }, [id]);

  // Open the first file automatically once the detail is loaded.
  useEffect(() => { if (detail && detail.files?.length > 0 && !cache.current.has(0) && !viewer.loading && !viewer.url && !viewer.error) showFile(0); },
    [detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = CHECKLIST_ITEMS.every((i) => checklist[i.key]);
  const reasonOk = reason.trim().length >= MIN_REASON;

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if (result.success) {
      setDetail(result.data);
      setMode(null); setReason(''); setNotes(''); setChecklist(EMPTY_CHECKLIST);
      onDecided();
    } else {
      setError(result.error);
      load(); // someone else may have decided — show the current state
    }
  };

  const approve = () => run(() => adminPoliceClearanceService.approve(id, checklist, notes));
  const confirmReasonAction = () => run(() => (mode === 'reject'
    ? adminPoliceClearanceService.reject(id, reason.trim())
    : adminPoliceClearanceService.revoke(id, reason.trim())));

  return (
    <div className="pcr-modal" role="dialog" data-testid="pcr-detail">
      <div className="pcr-panel">
        <div className="pcr-panel-head">
          <h2>{detail ? `${detail.caregiverName} — police clearance` : 'Police clearance'}</h2>
          <button type="button" className="pcr-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!detail && !error && <p>Loading…</p>}
        {error && <p className="pcr-error" data-testid="pcr-detail-error">{error}</p>}

        {detail && (
          <div className="pcr-grid">
            <div className="pcr-viewer">
              {detail.files.length > 1 && (
                <div className="pcr-tabs" role="tablist">
                  {detail.files.map((f) => (
                    <button key={f.index} type="button" role="tab" className={`pcr-tab${fileIndex === f.index ? ' pcr-tab--on' : ''}`}
                      onClick={() => showFile(f.index)} data-testid={`pcr-file-${f.index}`}>Page / file {f.index + 1}</button>
                  ))}
                </div>
              )}
              <div className="pcr-viewport" data-testid="pcr-viewport">
                {viewer.loading && <p>Opening file…</p>}
                {viewer.error && <p className="pcr-error">{viewer.error}</p>}
                {viewer.url && (String(viewer.type).startsWith('image/')
                  ? <img src={viewer.url} alt={`Clearance file ${fileIndex + 1}`} data-testid="pcr-image" />
                  : <iframe src={viewer.url} title="Clearance file" data-testid="pcr-iframe" />)}
                {detail.files.length === 0 && <p>No files on this submission.</p>}
              </div>
              <small className="pcr-hint">{detail.files.length} file{detail.files.length === 1 ? '' : 's'} · each file you open is recorded in the audit log.</small>
            </div>

            <div className="pcr-side">
              {!detail.isLatest && (
                <p className="pcr-warn" data-testid="pcr-not-latest">A newer submission has replaced this one — it can no longer be reviewed.</p>
              )}
              <span className={`pcr-chip pcr-chip--${detail.status}`} data-testid="pcr-detail-status">{STATUS_LABEL[detail.status] || detail.status}</span>

              <dl className="pcr-facts">
                <dt>Caregiver</dt><dd>{detail.caregiverName}<br /><small>{detail.caregiverEmail}</small></dd>
                <dt>Profile name</dt><dd>{detail.profileName}</dd>
                <dt>Name on document</dt>
                <dd>{detail.nameOnDocument || '—'}{' '}
                  <span className={`pcr-hint-chip ${detail.nameMatchHint === 'likely_match' ? 'pcr-hint-chip--ok' : 'pcr-hint-chip--check'}`} data-testid="pcr-name-hint" title="Only a hint — you still confirm it in the checklist">
                    {detail.nameMatchHint === 'likely_match' ? 'Looks like a match' : 'Check manually'}
                  </span>
                </dd>
                <dt>Reference no.</dt><dd>{detail.referenceNumber || '—'}</dd>
                <dt>Issue date</dt><dd>{longDate(detail.issueDate)} <small>(must be within {detail.maxAgeMonths} months of submission)</small></dd>
                <dt>Submitted</dt><dd>{detail.submittedAt ? formatLagos(detail.submittedAt) : '—'}</dd>
                {detail.decisionAt && (<><dt>{detail.status === 'revoked' ? 'Revoked' : 'Decided'}</dt><dd>{formatLagos(detail.decisionAt)} by {detail.decidedByEmail || 'admin'}</dd></>)}
                {detail.rejectionReason && (<><dt>Rejection reason</dt><dd data-testid="pcr-rejection-reason">{detail.rejectionReason}</dd></>)}
                {detail.revokedReason && (<><dt>Revoked reason</dt><dd>{detail.revokedReason}</dd></>)}
                {detail.reviewNotes && (<><dt>Notes</dt><dd>{detail.reviewNotes}</dd></>)}
              </dl>

              {(detail.canApprove || detail.status === 'approved') && (
                <fieldset className="pcr-checklist" disabled={!detail.canApprove || busy}>
                  <legend>Checklist {detail.canApprove ? '(all required to approve)' : ''}</legend>
                  {CHECKLIST_ITEMS.map((i) => (
                    <label key={i.key}>
                      <input type="checkbox" data-testid={`pcr-check-${i.key}`}
                        checked={detail.canApprove ? !!checklist[i.key] : detail.checklist?.[i.key] === true}
                        onChange={(e) => setChecklist((c) => ({ ...c, [i.key]: e.target.checked }))} />
                      {' '}{i.label}
                    </label>
                  ))}
                </fieldset>
              )}

              {detail.canApprove && mode === null && (
                <>
                  <label className="pcr-notes">Notes (optional)
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} data-testid="pcr-notes" />
                  </label>
                  <div className="pcr-actions">
                    <button type="button" className="pcr-btn pcr-btn--ok" disabled={!allChecked || busy} onClick={approve} data-testid="pcr-approve">
                      {busy ? 'Saving…' : 'Approve'}
                    </button>
                    <button type="button" className="pcr-btn pcr-btn--bad" disabled={busy} onClick={() => setMode('reject')} data-testid="pcr-reject-open">Reject…</button>
                  </div>
                  {!allChecked && <small className="pcr-hint">Tick every checklist item to enable Approve.</small>}
                </>
              )}

              {detail.canRevoke && mode === null && (
                <div className="pcr-actions">
                  <button type="button" className="pcr-btn pcr-btn--bad" disabled={busy} onClick={() => setMode('revoke')} data-testid="pcr-revoke-open">Revoke approval…</button>
                </div>
              )}

              {mode && (
                <div className="pcr-reason" data-testid="pcr-reason-box">
                  <label>{mode === 'reject' ? 'Reason for rejecting (sent to the caregiver)' : 'Reason for revoking (sent to the caregiver)'}
                    <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} data-testid="pcr-reason"
                      placeholder="Be specific so they know what to fix, e.g. “The reference number is cut off — please re-scan the full page.”" />
                  </label>
                  <small className="pcr-hint">At least {MIN_REASON} characters. Avoid including other people's personal details.</small>
                  <div className="pcr-actions">
                    <button type="button" className="pcr-btn pcr-btn--ghost" onClick={() => { setMode(null); setReason(''); }}>Cancel</button>
                    <button type="button" className="pcr-btn pcr-btn--bad" disabled={!reasonOk || busy} onClick={confirmReasonAction} data-testid="pcr-reason-confirm">
                      {busy ? 'Saving…' : mode === 'reject' ? 'Confirm rejection' : 'Confirm revocation'}
                    </button>
                  </div>
                </div>
              )}

              {detail.history?.length > 1 && (
                <details className="pcr-history" data-testid="pcr-history" open>
                  <summary>History ({detail.history.length})</summary>
                  <ul>
                    {detail.history.map((h) => (
                      <li key={h.id}>
                        <strong>{STATUS_LABEL[h.status] || h.status}{h.superseded ? ' (replaced)' : ''}</strong>{' '}
                        <small>submitted {h.submittedAt ? formatLagos(h.submittedAt) : '—'}{h.reason ? ` · ${h.reason}` : ''}</small>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceClearances;
