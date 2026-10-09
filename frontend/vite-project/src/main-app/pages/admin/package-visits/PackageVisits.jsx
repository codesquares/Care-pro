import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPackageVisitService from '../../../services/adminPackageVisitService';
import { formatLagos } from '../../../utils/lagosTime';
import './package-visits.css';

const REASON_LABEL = {
  distance_far: 'Far from confirmed location',
  geocoded_far: 'Far from address (geocoded)',
  location_not_confirmed: 'No service location on file',
  location_geocoded_only: 'Location not confirmed by client',
  low_accuracy: 'Low GPS accuracy',
};
const HARD = new Set(['distance_far', 'geocoded_far']);

const PackageVisits = () => {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('checkin');
  const [filters, setFilters] = useState({ flagged: 'any', unclearedOnly: false, from: '', to: '', caregiverId: '' });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(null); // { id, note }
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // A deep link from a notification must always show its visit, whatever the filters.
    const result = await AdminPackageVisitService.list(focusId ? { ...filters, flagged: 'all', unclearedOnly: false } : filters);
    if (result.success) setRows(result.data); else setError(result.error);
    setLoading(false);
  }, [filters, focusId]);

  useEffect(() => { load(); }, [load]);

  const caregivers = useMemo(() => {
    const m = new Map(); rows.forEach((r) => m.set(r.caregiverId, r.caregiverName)); return [...m.entries()];
  }, [rows]);

  const submitClear = async () => {
    if (!clearing || clearing.note.trim().length < 3) return;
    setSaving(true);
    const result = await AdminPackageVisitService.clearFlag(clearing.id, clearing.note.trim());
    setSaving(false);
    if (result.success) { setClearing(null); load(); } else setError(result.error);
  };

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="pv-page">
      <h1>Package Visits</h1>
      <p className="pv-sub">Check-ins are never blocked for location. Flagged ones are listed first for review.</p>

      <div className="pv-filters">
        <label>Flags
          <select value={filters.flagged} onChange={(e) => set('flagged', e.target.value)}>
            <option value="any">Any flag</option><option value="hard">Hard flags</option><option value="soft">Soft flags</option><option value="all">All visits</option>
          </select>
        </label>
        <label className="pv-check"><input type="checkbox" checked={filters.unclearedOnly} onChange={(e) => set('unclearedOnly', e.target.checked)} /> Uncleared only</label>
        <label>From<input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} /></label>
        <label>To<input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} /></label>
        <label>Caregiver
          <select value={filters.caregiverId} onChange={(e) => set('caregiverId', e.target.value)}>
            <option value="">All</option>{caregivers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="pv-error">{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p data-testid="pv-empty">No visits match these filters.</p> : (
        <table className="pv-table" data-testid="pv-table">
          <thead><tr><th>Check-in (WAT)</th><th>Caregiver</th><th>Client</th><th>Visit</th><th>Distance</th><th>Accuracy</th><th>Flags</th><th>Review</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.checkinId} data-checkin={r.checkinId} data-severity={r.severity} className={`pv-row pv-row--${r.severity}${r.flagCleared ? ' pv-row--cleared' : ''}${focusId === r.checkinId ? ' pv-row--focus' : ''}`}>
                <td>{formatLagos(r.checkinTimestamp)}</td>
                <td>{r.caregiverName}</td>
                <td>{r.clientName}</td>
                <td>#{r.sheetNumber} <small>{r.taskSheetStatus}{r.clientReviewStatus ? ` · ${r.clientReviewStatus}` : ''}{r.hasOpenDispute ? ' · OPEN DISPUTE' : ''}</small></td>
                <td>{r.distanceMeters != null ? `${Math.round(r.distanceMeters).toLocaleString()} m` : '—'}</td>
                <td>{Math.round(r.accuracyMeters).toLocaleString()} m</td>
                <td>
                  {r.reasons.length === 0 ? '—' : r.reasons.map((x) => (
                    <span key={x} className={`pv-chip ${HARD.has(x) ? 'pv-chip--hard' : 'pv-chip--soft'}`} data-reason={x}>{REASON_LABEL[x] || x}</span>
                  ))}
                </td>
                <td>
                  {r.flagCleared
                    ? <span data-testid="cleared">Cleared {formatLagos(r.flagClearedAt)} by {r.flagClearedByAdminEmail || 'admin'}: “{r.flagClearNote}”</span>
                    : r.reasons.length > 0 ? 'Needs review' : ''}
                </td>
                <td>{r.reasons.length > 0 && !r.flagCleared && (
                  <button type="button" className="pv-btn" onClick={() => setClearing({ id: r.checkinId, note: '' })}>Clear flag</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {clearing && (
        <div className="pv-modal" role="dialog" data-testid="clear-dialog">
          <div className="pv-modal-body">
            <h3>Clear this flag</h3>
            <p>Say why the check-in is fine (required). Who, when and your note are recorded; the flag stays visible in history.</p>
            <textarea rows={3} value={clearing.note} onChange={(e) => setClearing({ ...clearing, note: e.target.value })} placeholder="e.g. Called the client — caregiver was at the right house" />
            <div className="pv-modal-actions">
              <button type="button" className="pv-btn pv-btn--ghost" onClick={() => setClearing(null)}>Cancel</button>
              <button type="button" className="pv-btn" disabled={saving || clearing.note.trim().length < 3} onClick={submitClear}>{saving ? 'Saving…' : 'Clear flag'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageVisits;
