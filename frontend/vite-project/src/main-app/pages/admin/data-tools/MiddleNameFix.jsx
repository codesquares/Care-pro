import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../../services/adminService';
import './middle-name-fix.css';

const PLACEHOLDER = 'testing';
const BATCH_SIZE  = 500;
const REASON      = 'Clearing test placeholder middle name from signup';

const fmtName = (u) =>
  [u.firstName || u.FirstName, u.middleName || u.MiddleName, u.lastName || u.LastName]
    .filter(Boolean).join(' ');

const MiddleNameFix = () => {
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const adminId     = userDetails.id || '';

  // ── data
  const [rows,    setRows]    = useState([]);   // {id, name, role, email}
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  // ── selection
  const [selected, setSelected] = useState(new Set());

  // ── fix state
  const [fixing,  setFixing]  = useState(false);
  const [summary, setSummary] = useState(null);  // {cleared, skipped, failed, failedIds}

  // ── load both lists in parallel, filter by middleName === "testing"
  const loadAffected = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    setSummary(null);
    setSelected(new Set());

    const [cgRes, clRes] = await Promise.all([
      adminService.getAllCaregivers(),
      adminService.getAllClients(),
    ]);

    const errors = [];
    if (!cgRes.success) errors.push(`Caregivers: ${cgRes.error}`);
    if (!clRes.success) errors.push(`Clients: ${clRes.error}`);

    if (errors.length === 2) {
      setFetchErr(errors.join(' | '));
      setLoading(false);
      return;
    }

    const norm = (val) => (val || '').toString().trim().toLowerCase();

    const caregivers = (cgRes.data || [])
      .filter(u => norm(u.middleName || u.MiddleName) === PLACEHOLDER)
      .map(u => ({
        id:    u.id   || u.Id   || u.caregiverId || u.CaregiverId,
        name:  fmtName(u),
        email: u.email || u.Email || '—',
        role:  'Caregiver',
      }));

    const clients = (clRes.data || [])
      .filter(u => norm(u.middleName || u.MiddleName) === PLACEHOLDER)
      .map(u => ({
        id:    u.id   || u.Id   || u.clientId || u.ClientId,
        name:  fmtName(u),
        email: u.email || u.Email || '—',
        role:  'Client',
      }));

    if (errors.length === 1) setFetchErr(`Partial load — ${errors[0]}`);

    setRows([...caregivers, ...clients]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAffected(); }, [loadAffected]);

  // ── select helpers
  const allSelected  = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map(r => r.id)));
    }
  };

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── split & call both endpoints
  const handleFix = async () => {
    if (selected.size === 0) { toast.warning('Select at least one record to fix.'); return; }

    const selectedRows = rows.filter(r => selected.has(r.id));
    const cgIds = selectedRows.filter(r => r.role === 'Caregiver').map(r => r.id);
    const clIds = selectedRows.filter(r => r.role === 'Client').map(r => r.id);

    setFixing(true);
    setSummary(null);

    // Helper to chunk into batches of BATCH_SIZE
    const chunk = (arr) => {
      const batches = [];
      for (let i = 0; i < arr.length; i += BATCH_SIZE) {
        batches.push(arr.slice(i, i + BATCH_SIZE));
      }
      return batches;
    };

    let totalCleared = 0, totalSkipped = 0, totalFailed = 0;
    const allFailedIds = [];

    try {
      // Caregivers
      for (const batch of chunk(cgIds)) {
        const res = await adminService.bulkClearCaregiverMiddleName(adminId, batch, REASON);
        if (res.success) {
          totalCleared += res.data?.cleared  ?? 0;
          totalSkipped += res.data?.skipped  ?? 0;
          totalFailed  += res.data?.failed   ?? 0;
          if (res.data?.failedIds) allFailedIds.push(...res.data.failedIds);
        } else {
          toast.error(`Caregiver batch failed: ${res.error}`);
          totalFailed += batch.length;
        }
      }

      // Clients
      for (const batch of chunk(clIds)) {
        const res = await adminService.bulkClearClientMiddleName(adminId, batch, REASON);
        if (res.success) {
          totalCleared += res.data?.cleared  ?? 0;
          totalSkipped += res.data?.skipped  ?? 0;
          totalFailed  += res.data?.failed   ?? 0;
          if (res.data?.failedIds) allFailedIds.push(...res.data.failedIds);
        } else {
          toast.error(`Client batch failed: ${res.error}`);
          totalFailed += batch.length;
        }
      }

      setSummary({
        cleared:   totalCleared,
        skipped:   totalSkipped,
        failed:    totalFailed,
        failedIds: allFailedIds,
      });

      if (totalFailed === 0) {
        toast.success(`Done — ${totalCleared} middle name(s) cleared.`);
      } else {
        toast.warning(`Completed with ${totalFailed} failure(s). See summary below.`);
      }

      // Refresh the list to remove fixed records
      loadAffected();

    } catch (err) {
      toast.error('Unexpected error. Check console.');
      console.error(err);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="mnf-page">
      {/* Header */}
      <div className="mnf-header">
        <div className="mnf-header-left">
          <div className="mnf-header-icon"><i className="fas fa-broom"></i></div>
          <div>
            <h1>Fix Placeholder Middle Names</h1>
            <p>Users who signed up with <code>"testing"</code> stored as their middle name</p>
          </div>
        </div>
        <button className="btn-secondary btn-sm" onClick={loadAffected} disabled={loading || fixing}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Summary banner */}
      {summary && (
        <div className={`mnf-summary ${summary.failed > 0 ? 'mnf-summary--warn' : 'mnf-summary--ok'}`}>
          <i className={`fas ${summary.failed > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
          <div>
            <strong>Operation complete — </strong>
            {summary.cleared} cleared &nbsp;·&nbsp; {summary.skipped} skipped (already null) &nbsp;·&nbsp; {summary.failed} failed
            {summary.failedIds.length > 0 && (
              <div className="mnf-failed-ids">
                Failed IDs: <code>{summary.failedIds.join(', ')}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {fetchErr && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle"></i>
          <div><p>{fetchErr}</p></div>
        </div>
      )}

      {/* Stats row */}
      <div className="mnf-stats">
        <div className="mnf-stat">
          <span className="mnf-stat-num">{rows.length}</span>
          <span className="mnf-stat-lbl">Affected Users</span>
        </div>
        <div className="mnf-stat">
          <span className="mnf-stat-num">{rows.filter(r => r.role === 'Caregiver').length}</span>
          <span className="mnf-stat-lbl">Caregivers</span>
        </div>
        <div className="mnf-stat">
          <span className="mnf-stat-num">{rows.filter(r => r.role === 'Client').length}</span>
          <span className="mnf-stat-lbl">Clients</span>
        </div>
        <div className="mnf-stat mnf-stat--selected">
          <span className="mnf-stat-num">{selected.size}</span>
          <span className="mnf-stat-lbl">Selected</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mnf-toolbar">
        {rows.length > 0 && (
          <label className="mnf-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleAll}
            />
            Select all ({rows.length})
          </label>
        )}
        <button
          className="btn-primary"
          onClick={handleFix}
          disabled={selected.size === 0 || fixing || loading}
        >
          {fixing ? (
            <><i className="fas fa-spinner fa-spin"></i> Fixing…</>
          ) : (
            <><i className="fas fa-magic"></i> Fix Selected ({selected.size})</>
          )}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="mnf-loading">
          <div className="spinner"></div>
          <p>Loading affected users…</p>
        </div>
      ) : rows.length === 0 && !fetchErr ? (
        <div className="mnf-empty">
          <i className="fas fa-check-double"></i>
          <p>No users found with <code>"testing"</code> as middle name. All clean!</p>
        </div>
      ) : (
        <div className="mnf-table-wrap">
          <table className="mnf-table">
            <thead>
              <tr>
                <th className="mnf-th-check"></th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className={selected.has(row.id) ? 'mnf-row--selected' : ''}
                  onClick={() => toggleRow(row.id)}
                >
                  <td className="mnf-td-check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                    />
                  </td>
                  <td className="mnf-td-name">{row.name || '—'}</td>
                  <td className="mnf-td-email">{row.email}</td>
                  <td>
                    <span className={`mnf-role-badge mnf-role-badge--${row.role.toLowerCase()}`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="mnf-td-id">{row.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MiddleNameFix;
