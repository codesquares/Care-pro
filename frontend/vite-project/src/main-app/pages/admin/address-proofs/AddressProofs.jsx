import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminAddressProofService, { ADDRESS_CHECKLIST_ITEMS } from '../../../services/adminAddressProofService';
import { formatLagos } from '../../../utils/lagosTime';
import '../police-clearances/police-clearances.css';

export const ADDRESS_PROOF_COUNT_CHANGED_EVENT = 'address-proof-count-changed';

const STATUS_LABEL = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };
const MIN_REASON = 5;

const longDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
};

const EMPTY_CHECKLIST = {
  nameMatchesProfile: false, addressMatchesEntry: false, billWithinAllowedAge: false, scanLegibleAndUnaltered: false,
};

const AddressProofs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('proof');

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
    const result = await adminAddressProofService.list({ status, search });
    if (result.success) { setRows(result.data.items || []); setTotal(result.data.totalCount || 0); } else setError(result.error);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const closeDetail = () => {
    setOpenId(null);
    if (searchParams.get('proof')) { searchParams.delete('proof'); setSearchParams(searchParams, { replace: true }); }
  };

  const afterDecision = () => {
    window.dispatchEvent(new Event(ADDRESS_PROOF_COUNT_CHANGED_EVENT));
    load();
  };

  return (
    <div className="pcr-page" data-testid="apr-page">
      <h1>Address Proofs</h1>
      <p className="pcr-sub">
        Each caregiver must upload a recent power-holding (NEPA) bill for their current address before their address history counts as
        complete. Opening a file is recorded in the audit log. Approving requires every checklist item; rejecting requires a reason,
        which the caregiver receives.
      </p>

      <div className="pcr-filters">
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="apr-status-filter">
            <option value="pending">Pending review</option>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>Search caregiver
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" data-testid="apr-search" />
        </label>
        <button type="button" className="pcr-btn pcr-btn--ghost" onClick={load}>Refresh</button>
        <span className="pcr-count">{total} result{total === 1 ? '' : 's'} · oldest first</span>
      </div>

      {error && <p className="pcr-error">{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? (
        <p data-testid="apr-empty">{status === 'pending' ? 'Nothing is waiting for review.' : 'No bills match these filters.'}</p>
      ) : (
        <table className="pcr-table" data-testid="apr-table">
          <thead><tr><th>Caregiver</th><th>Current address</th><th>Name on bill</th><th>Bill date</th><th>Submitted (WAT)</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-proof={r.id} data-status={r.status} className={focusId === r.id ? 'pcr-row--focus' : ''}>
                <td>{r.caregiverName}<br /><small>{r.caregiverEmail}</small></td>
                <td>{r.address}</td>
                <td>{r.nameOnBill || '—'}</td>
                <td>{longDate(r.billDate)}</td>
                <td>{r.submittedAt ? formatLagos(r.submittedAt) : '—'}</td>
                <td><span className={`pcr-chip pcr-chip--${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                <td><button type="button" className="pcr-btn" onClick={() => setOpenId(r.id)} data-testid="apr-review">{r.status === 'pending' ? 'Review' : 'Open'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openId && <ProofDetail key={openId} id={openId} onClose={closeDetail} onDecided={afterDecision} />}
    </div>
  );
};

const ProofDetail = ({ id, onClose, onDecided }) => {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState({ loading: true, error: null, url: null, type: null });

  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState(null); // null | 'reject'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await adminAddressProofService.detail(id);
    if (result.success) { setDetail(result.data); setError(null); } else setError(result.error);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // Open the bill once (one fetch = one audit entry) and revoke the object URL when the panel closes. The URL is created and
  // revoked inside the same effect so React StrictMode's double-invoke can't leave a revoked URL in state.
  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    (async () => {
      const result = await adminAddressProofService.fetchFile(id);
      if (cancelled) return;
      if (!result.success) { setViewer({ loading: false, error: result.error, url: null, type: null }); return; }
      objectUrl = URL.createObjectURL(result.data);
      setViewer({ loading: false, error: null, url: objectUrl, type: result.data.type });
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);

  const allChecked = ADDRESS_CHECKLIST_ITEMS.every((i) => checklist[i.key]);
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

  const approve = () => run(() => adminAddressProofService.approve(id, checklist, notes));
  const confirmReject = () => run(() => adminAddressProofService.reject(id, reason.trim()));

  return (
    <div className="pcr-modal" role="dialog" data-testid="apr-detail">
      <div className="pcr-panel">
        <div className="pcr-panel-head">
          <h2>{detail ? `${detail.caregiverName} — address bill` : 'Address bill'}</h2>
          <button type="button" className="pcr-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!detail && !error && <p>Loading…</p>}
        {error && <p className="pcr-error" data-testid="apr-detail-error">{error}</p>}

        {detail && (
          <div className="pcr-grid">
            <div className="pcr-viewer">
              <div className="pcr-viewport" data-testid="apr-viewport">
                {viewer.loading && <p>Opening file…</p>}
                {viewer.error && <p className="pcr-error">{viewer.error}</p>}
                {viewer.url && (String(viewer.type).startsWith('image/')
                  ? <img src={viewer.url} alt="Address bill" data-testid="apr-image" />
                  : <iframe src={viewer.url} title="Address bill" data-testid="apr-iframe" />)}
              </div>
              <small className="pcr-hint">Opening this file is recorded in the audit log.</small>
            </div>

            <div className="pcr-side">
              <span className={`pcr-chip pcr-chip--${detail.status}`} data-testid="apr-detail-status">{STATUS_LABEL[detail.status] || detail.status}</span>

              <dl className="pcr-facts">
                <dt>Caregiver</dt><dd>{detail.caregiverName}<br /><small>{detail.caregiverEmail}</small></dd>
                <dt>Profile name</dt><dd>{detail.profileName}</dd>
                <dt>Name on bill</dt>
                <dd>{detail.nameOnBill || '—'}{' '}
                  <span className={`pcr-hint-chip ${detail.nameMatchHint === 'likely_match' ? 'pcr-hint-chip--ok' : 'pcr-hint-chip--check'}`} data-testid="apr-name-hint" title="Only a hint — you still confirm it in the checklist">
                    {detail.nameMatchHint === 'likely_match' ? 'Looks like a match' : 'Check manually'}
                  </span>
                </dd>
                <dt>Address entered</dt><dd data-testid="apr-address">{detail.address}</dd>
                <dt>Moved in</dt><dd>{longDate(detail.movedIn)}</dd>
                <dt>Bill date</dt><dd>{longDate(detail.billDate)} <small>(must be within {detail.maxBillAgeMonths} months of submission)</small></dd>
                <dt>Submitted</dt><dd>{detail.submittedAt ? formatLagos(detail.submittedAt) : '—'}</dd>
                {detail.decisionAt && (<><dt>Decided</dt><dd>{formatLagos(detail.decisionAt)} by {detail.decidedByEmail || 'admin'}</dd></>)}
                {detail.rejectionReason && (<><dt>Rejection reason</dt><dd data-testid="apr-rejection-reason">{detail.rejectionReason}</dd></>)}
                {detail.reviewNotes && (<><dt>Notes</dt><dd>{detail.reviewNotes}</dd></>)}
              </dl>

              {(detail.canReview || detail.status === 'approved') && (
                <fieldset className="pcr-checklist" disabled={!detail.canReview || busy}>
                  <legend>Checklist {detail.canReview ? '(all required to approve)' : ''}</legend>
                  {ADDRESS_CHECKLIST_ITEMS.map((i) => (
                    <label key={i.key}>
                      <input type="checkbox" data-testid={`apr-check-${i.key}`}
                        checked={detail.canReview ? !!checklist[i.key] : detail.checklist?.[i.key] === true}
                        onChange={(e) => setChecklist((c) => ({ ...c, [i.key]: e.target.checked }))} />
                      {' '}{i.label}
                    </label>
                  ))}
                </fieldset>
              )}

              {detail.status === 'pending' && !detail.canReview && (
                <p className="pcr-warn">The caregiver has since marked this address as a past address, so it no longer needs a bill.</p>
              )}

              {detail.canReview && mode === null && (
                <>
                  <label className="pcr-notes">Notes (optional)
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} data-testid="apr-notes" />
                  </label>
                  <div className="pcr-actions">
                    <button type="button" className="pcr-btn pcr-btn--ok" disabled={!allChecked || busy} onClick={approve} data-testid="apr-approve">
                      {busy ? 'Saving…' : 'Approve'}
                    </button>
                    <button type="button" className="pcr-btn pcr-btn--bad" disabled={busy} onClick={() => setMode('reject')} data-testid="apr-reject-open">Reject…</button>
                  </div>
                  {!allChecked && <small className="pcr-hint">Tick every checklist item to enable Approve.</small>}
                </>
              )}

              {mode && (
                <div className="pcr-reason" data-testid="apr-reason-box">
                  <label>Reason for rejecting (sent to the caregiver)
                    <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} data-testid="apr-reason"
                      placeholder="Be specific so they know what to fix, e.g. “The address on the bill is different from the one you entered.”" />
                  </label>
                  <small className="pcr-hint">At least {MIN_REASON} characters. Avoid including other people's personal details.</small>
                  <div className="pcr-actions">
                    <button type="button" className="pcr-btn pcr-btn--ghost" onClick={() => { setMode(null); setReason(''); }}>Cancel</button>
                    <button type="button" className="pcr-btn pcr-btn--bad" disabled={!reasonOk || busy} onClick={confirmReject} data-testid="apr-reason-confirm">
                      {busy ? 'Saving…' : 'Confirm rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressProofs;
