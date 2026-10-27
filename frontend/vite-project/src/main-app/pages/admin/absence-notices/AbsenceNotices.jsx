import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminAbsenceNoticeService, { STATUSES, STATUS_LABELS } from '../../../services/adminAbsenceNoticeService';
import { formatLagos } from '../../../utils/lagosTime';
import '../police-clearances/police-clearances.css';

const fmtDay = (iso) =>
  iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtAge = (hours) => {
  if (hours == null) return '—';
  if (hours < 1) return '<1h';
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
};

const SETTABLE = STATUSES; // staff may set any status; "withdrawn" is terminal on the server

const AbsenceNotices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('notice');

  const [status, setStatus] = useState(focusId ? 'all' : 'open');
  const [shortOnly, setShortOnly] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const [openId, setOpenId] = useState(focusId || null);
  const [detail, setDetail] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await adminAbsenceNoticeService.list({ status, shortNotice: shortOnly });
    if (r.success) setRows(r.data);
    else if (r.status === 403) setForbidden(true);
    else setError(r.error);
    setLoading(false);
  }, [status, shortOnly]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!openId) { setDetail(null); return; }
    let live = true;
    adminAbsenceNoticeService.detail(openId).then((r) => { if (live && r.success) { setDetail(r.data); setNewStatus(''); setNote(''); setSaveError(null); } });
    return () => { live = false; };
  }, [openId]);

  const closeDetail = () => {
    setOpenId(null);
    if (searchParams.get('notice')) { searchParams.delete('notice'); setSearchParams(searchParams, { replace: true }); }
  };

  const save = async () => {
    if (saving) return;
    if (!newStatus) { setSaveError('Choose a status.'); return; }
    if (!note.trim()) { setSaveError('A note is required.'); return; }
    setSaving(true); setSaveError(null);
    const r = await adminAbsenceNoticeService.setStatus(openId, newStatus, note.trim());
    setSaving(false);
    if (!r.success) { setSaveError(r.error); return; }
    setDetail(r.data); setNewStatus(''); setNote('');
    load();
  };

  if (forbidden) {
    return (
      <div className="pcr-page" data-testid="absence-forbidden">
        <h1>Caregiver absence notices</h1>
        <p className="pcr-warn">Your department doesn't have access to this screen. Ask an Operations admin to handle it.</p>
      </div>
    );
  }

  return (
    <div className="pcr-page" data-testid="absence-page">
      <h1>Caregiver absence notices</h1>
      <p className="pcr-sub">
        A caregiver has told us they can't attend a day the client has paid for. Decide what CarePro does and record it here.
      </p>
      <p className="pcr-warn" data-testid="absence-manual-warning">
        Setting a status here is a <strong>record only</strong>. It does not move money, change payroll, change the visit or change the
        assignment. Any actual credit or replacement cover is arranged manually, outside this screen, for now.
      </p>

      <div className="pcr-filters">
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="absence-filter-status">
            <option value="all">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label><span>Short notice</span>
          <input type="checkbox" checked={shortOnly} onChange={(e) => setShortOnly(e.target.checked)} data-testid="absence-filter-short" />
        </label>
        <span className="pcr-count">{rows.length} notice{rows.length === 1 ? '' : 's'}</span>
      </div>

      {error && <p className="pcr-error">{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p data-testid="absence-empty">No notices match.</p> : (
        <table className="pcr-table" data-testid="absence-table">
          <thead>
            <tr><th>Day</th><th>Package</th><th>Client</th><th>Caregiver</th><th>Reason</th><th>Short notice</th><th>Status</th><th>Age</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className={n.id === focusId ? 'pcr-row--focus' : ''} data-testid="absence-row">
                <td>{fmtDay(n.date)}</td>
                <td>{n.packageName}</td>
                <td>{n.clientFirstName}</td>
                <td>{n.caregiverName}</td>
                <td>{n.categoryLabel}</td>
                <td>{n.shortNotice ? <strong data-testid="absence-short-flag">Yes</strong> : 'No'}</td>
                <td><span className={`pcr-chip pcr-chip--${n.status === 'open' ? 'pending' : n.status === 'withdrawn' ? 'revoked' : 'approved'}`}>{STATUS_LABELS[n.status] || n.status}</span></td>
                <td>{fmtAge(n.ageHours)}</td>
                <td><button type="button" className="pcr-btn pcr-btn--ghost" onClick={() => setOpenId(n.id)} data-testid="absence-open-btn">Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openId && (
        <div className="pcr-modal" role="dialog" aria-modal="true" data-testid="absence-detail">
          <div className="pcr-panel">
            <div className="pcr-panel-head">
              <h2>{detail ? `${fmtDay(detail.date)} — ${detail.caregiverName}` : 'Notice'}</h2>
              <button type="button" className="pcr-x" onClick={closeDetail} aria-label="Close">×</button>
            </div>
            {!detail ? <p>Loading…</p> : (
              <>
                <dl>
                  <dt>Client</dt><dd>{detail.clientFirstName} · {detail.packageName}</dd>
                  <dt>Reason</dt><dd data-testid="absence-detail-category">{detail.categoryLabel}</dd>
                  <dt>Caregiver's note (staff only — the client never sees it)</dt>
                  <dd data-testid="absence-detail-note">{detail.note ? detail.note : '— none —'}</dd>
                  <dt>Short notice</dt><dd>{detail.shortNotice ? 'Yes — under 24 hours before 09:00 on the day (flag only; nothing penalises the caregiver)' : 'No'}</dd>
                  <dt>Status</dt><dd data-testid="absence-detail-status">{STATUS_LABELS[detail.status] || detail.status}</dd>
                </dl>

                {detail.history?.length > 0 && (
                  <ul data-testid="absence-history">
                    {detail.history.map((h, i) => (
                      <li key={i}>
                        {formatLagos(h.at)} — {h.kind === 'escalated' ? 'Re-alerted admins (still open, day within 24h)' : `${STATUS_LABELS[h.fromStatus] || h.fromStatus} → ${STATUS_LABELS[h.toStatus] || h.toStatus}`}
                        {' '}({h.actorType}{h.note ? `: ${h.note}` : ''})
                      </li>
                    ))}
                  </ul>
                )}

                {detail.status === 'withdrawn' ? (
                  <p className="pcr-hint">This notice was withdrawn. The caregiver can give a new notice for that day.</p>
                ) : (
                  <div>
                    <p className="pcr-warn">
                      Record only — no money, payroll, visit or assignment changes. Arrange any credit or cover manually. The client is
                      told automatically only for <em>Cover arranged</em>, <em>Credited</em> and <em>Withdrawn</em>.
                    </p>
                    <label>New status{' '}
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} data-testid="absence-new-status">
                        <option value="">Choose…</option>
                        {SETTABLE.filter((s) => s !== detail.status).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'block', marginTop: 8 }}>Note (required, staff only)
                      <textarea rows="3" maxLength={500} style={{ width: '100%' }} value={note} onChange={(e) => setNote(e.target.value)} data-testid="absence-status-note" />
                    </label>
                    {saveError && <p className="pcr-error" data-testid="absence-save-error">{saveError}</p>}
                    <button type="button" className="pcr-btn" onClick={save} disabled={saving} data-testid="absence-save">{saving ? 'Saving…' : 'Record status'}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceNotices;
