import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import chatViolationsService from '../../../services/chatViolationsService';
import './chat-compliance.css';

const PAGE_SIZE = 20;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const ChatCompliance = () => {
  const [activeTab, setActiveTab]       = useState('violations'); // 'violations' | 'repeat'

  // ── violations tab
  const [violations, setViolations]     = useState([]);
  const [vLoading, setVLoading]         = useState(false);
  const [vError, setVError]             = useState(null);
  const [skip, setSkip]                 = useState(0);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [hasMore, setHasMore]           = useState(false);

  // ── repeat offenders tab
  const [offenders, setOffenders]       = useState([]);
  const [oLoading, setOLoading]         = useState(false);
  const [oError, setOError]             = useState(null);
  const [minViolations, setMinViolations] = useState(3);
  const [days, setDays]                 = useState(30);

  // ── detail modal
  const [detailItem, setDetailItem]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ─── load violations ──────────────────────────────────
  const loadViolations = useCallback(async (newSkip = 0) => {
    setVLoading(true);
    setVError(null);
    const result = await chatViolationsService.getViolations({
      skip: newSkip,
      take: PAGE_SIZE,
      userId: userIdFilter.trim() || undefined,
      violationType: typeFilter.trim() || undefined,
    });
    if (result.success) {
      const data = result.data || [];
      if (newSkip === 0) {
        setViolations(data);
      } else {
        setViolations(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setSkip(newSkip);
    } else {
      setVError(result.error);
    }
    setVLoading(false);
  }, [userIdFilter, typeFilter]);

  useEffect(() => {
    if (activeTab === 'violations') loadViolations(0);
  }, [activeTab, loadViolations]);

  const handleVFilterSubmit = (e) => {
    e.preventDefault();
    loadViolations(0);
  };

  const handleLoadMore = () => loadViolations(skip + PAGE_SIZE);

  // ─── load repeat offenders ────────────────────────────
  const loadOffenders = useCallback(async () => {
    setOLoading(true);
    setOError(null);
    const result = await chatViolationsService.getRepeatOffenders(minViolations, days);
    if (result.success) {
      setOffenders(result.data || []);
    } else {
      setOError(result.error);
    }
    setOLoading(false);
  }, [minViolations, days]);

  useEffect(() => {
    if (activeTab === 'repeat') loadOffenders();
  }, [activeTab, loadOffenders]);

  // ─── detail modal ─────────────────────────────────────
  const openDetail = async (item) => {
    const id = item.id || item.Id;
    if (!id) { toast.error('Violation ID not available'); return; }
    setDetailLoading(true);
    const result = await chatViolationsService.getViolationDetail(id);
    if (result.success) {
      setDetailItem(result.data);
    } else {
      toast.error(result.error || 'Failed to load violation detail');
    }
    setDetailLoading(false);
  };

  // ─── helpers ──────────────────────────────────────────
  const severityClass = (v) => {
    const t = (v.violationType || v.ViolationType || '').toLowerCase();
    if (t.includes('severe') || t.includes('ban')) return 'cc-badge cc-badge--red';
    if (t.includes('warn'))  return 'cc-badge cc-badge--orange';
    return 'cc-badge cc-badge--grey';
  };

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-icon"><i className="fas fa-shield-virus"></i></div>
        <div>
          <h1>Chat Compliance</h1>
          <p>Monitor and review chat policy violations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="cc-tabs">
        <button className={`cc-tab${activeTab === 'violations' ? ' cc-tab--active' : ''}`} onClick={() => setActiveTab('violations')}>
          <i className="fas fa-exclamation-triangle"></i> Violations
        </button>
        <button className={`cc-tab${activeTab === 'repeat' ? ' cc-tab--active' : ''}`} onClick={() => setActiveTab('repeat')}>
          <i className="fas fa-user-clock"></i> Repeat Offenders
        </button>
      </div>

      {/* ── VIOLATIONS TAB ── */}
      {activeTab === 'violations' && (
        <div>
          {/* Filter row */}
          <form className="cc-filters" onSubmit={handleVFilterSubmit}>
            <div className="cc-filter-group">
              <label>User ID</label>
              <input
                type="text"
                value={userIdFilter}
                onChange={e => setUserIdFilter(e.target.value)}
                placeholder="Filter by user ID…"
              />
            </div>
            <div className="cc-filter-group">
              <label>Violation Type</label>
              <input
                type="text"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                placeholder="e.g. ContactSharing…"
              />
            </div>
            <button type="submit" className="btn-primary btn-sm" disabled={vLoading}>
              <i className="fas fa-filter"></i> Apply
            </button>
            {(userIdFilter || typeFilter) && (
              <button type="button" className="btn-secondary btn-sm" onClick={() => { setUserIdFilter(''); setTypeFilter(''); }}>
                <i className="fas fa-times"></i> Clear
              </button>
            )}
            <button type="button" className="btn-secondary btn-sm" onClick={() => loadViolations(0)} disabled={vLoading}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </form>

          {vError && <div className="cc-error"><i className="fas fa-exclamation-circle"></i> {vError}</div>}

          {vLoading && violations.length === 0 ? (
            <div className="cc-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : violations.length === 0 ? (
            <div className="cc-empty"><i className="fas fa-check-circle"></i><p>No violations found</p></div>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Violation Type</th>
                    <th>Message (excerpt)</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, idx) => {
                    const id   = v.id || v.Id || idx;
                    const user = v.userName || v.UserName || v.userId || v.UserId || '—';
                    const type = v.violationType || v.ViolationType || '—';
                    const msg  = v.messageContent || v.MessageContent || v.content || '—';
                    const date = v.createdAt || v.CreatedAt || v.timestamp;
                    return (
                      <tr key={id}>
                        <td className="cc-user-cell">
                          <i className="fas fa-user-circle"></i> {user}
                        </td>
                        <td><span className={severityClass(v)}>{type}</span></td>
                        <td className="cc-msg-cell" title={msg}>{String(msg).substring(0, 80)}{msg.length > 80 ? '…' : ''}</td>
                        <td>{fmtDate(date)}</td>
                        <td>
                          <button
                            className="btn-icon btn-icon--view"
                            title="View detail"
                            onClick={() => openDetail(v)}
                            disabled={detailLoading}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasMore && (
                <div className="cc-loadmore">
                  <button className="btn-secondary" onClick={handleLoadMore} disabled={vLoading}>
                    {vLoading ? <><i className="fas fa-spinner fa-spin"></i> Loading…</> : 'Load More'}
                  </button>
                </div>
              )}
              <p className="cc-count">{violations.length} violation{violations.length !== 1 ? 's' : ''} shown</p>
            </div>
          )}
        </div>
      )}

      {/* ── REPEAT OFFENDERS TAB ── */}
      {activeTab === 'repeat' && (
        <div>
          {/* Threshold controls */}
          <div className="cc-thresholds">
            <div className="cc-filter-group">
              <label>Min Violations</label>
              <input
                type="number" min={1} value={minViolations}
                onChange={e => setMinViolations(Number(e.target.value))}
              />
            </div>
            <div className="cc-filter-group">
              <label>Within Days</label>
              <input
                type="number" min={1} value={days}
                onChange={e => setDays(Number(e.target.value))}
              />
            </div>
            <button className="btn-primary btn-sm" onClick={loadOffenders} disabled={oLoading}>
              <i className="fas fa-search"></i> Fetch
            </button>
          </div>

          {oError && <div className="cc-error"><i className="fas fa-exclamation-circle"></i> {oError}</div>}

          {oLoading ? (
            <div className="cc-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : offenders.length === 0 ? (
            <div className="cc-empty">
              <i className="fas fa-user-check"></i>
              <p>No repeat offenders found for current thresholds</p>
            </div>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Violations</th>
                    <th>Last Violation</th>
                  </tr>
                </thead>
                <tbody>
                  {offenders.map((o, idx) => {
                    const id    = o.userId || o.UserId || idx;
                    const name  = o.userName || o.UserName || o.name || o.Name || '—';
                    const email = o.email || o.Email || '—';
                    const count = o.violationCount || o.ViolationCount || o.count || '—';
                    const last  = o.lastViolation || o.LastViolation || o.lastOccurrence;
                    return (
                      <tr key={id}>
                        <td className="cc-user-cell"><i className="fas fa-user-circle"></i> {name}</td>
                        <td>{email}</td>
                        <td>
                          <span className="cc-badge cc-badge--red cc-badge--lg">{count}</span>
                        </td>
                        <td>{fmtDate(last)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="cc-count">{offenders.length} repeat offender{offenders.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailItem && (
        <div className="cc-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h2><i className="fas fa-file-alt"></i> Violation Detail</h2>
              <button className="cc-modal-close" onClick={() => setDetailItem(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="cc-modal-body">
              <div className="cc-detail-grid">
                {Object.entries(detailItem).map(([key, val]) => {
                  if (val === null || val === undefined || val === '') return null;
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                  const display = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
                  return (
                    <div key={key} className="cc-detail-row">
                      <span className="cc-detail-label">{label}</span>
                      <span className={`cc-detail-value${key.toLowerCase().includes('message') || key.toLowerCase().includes('content') ? ' cc-detail-value--block' : ''}`}>
                        {display}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatCompliance;
