import { useState, useEffect, useCallback } from 'react';
import {
  getAnalyticsEvents,
  fetchGigViewsOverview,
  fetchTopGigViews,
  fetchGigViewsTimeseries,
} from '../../../services/analyticsService';
import adminService from '../../../services/adminService';
import './AnalyticsDashboard.css';

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All event types' },
  { value: 'page_view', label: 'Page view' },
  { value: 'cta_click', label: 'CTA click' },
  { value: 'signup_complete', label: 'Signup complete' },
];

const PAGE_OPTIONS = [
  { value: '', label: 'All pages' },
  { value: 'become_caregiver', label: 'Become a Caregiver' },
  { value: 'marketplace', label: 'Marketplace' },
];

const PAGE_SIZE = 50;

const formatDateTime = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const toApiDate = (yyyyMmDd, endOfDay = false) => {
  if (!yyyyMmDd) return undefined;
  return endOfDay ? `${yyyyMmDd}T23:59:59Z` : `${yyyyMmDd}T00:00:00Z`;
};

const formatDateLabel = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatEventType = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const JOURNEY_STAGES = [
  'Registered', 'ProfileStarted', 'ProfessionalDataAdded',
  'Verified', 'AssessmentPassed', 'ReadyToPublish', 'Published',
];

const STAGE_COLORS = {
  Registered: '#94a3b8',
  ProfileStarted: '#60a5fa',
  ProfessionalDataAdded: '#a78bfa',
  Verified: '#34d399',
  AssessmentPassed: '#fbbf24',
  ReadyToPublish: '#f97316',
  Published: '#10b981',
};

const SNAPSHOT_BOOL_FILTERS = [
  { key: 'isIdentityVerified', label: 'Identity Verified' },
  { key: 'hasProfilePicture', label: 'Has Profile Pic' },
  { key: 'hasPassedAssessment', label: 'Passed Assessment' },
  { key: 'hasPublishedGig', label: 'Has Published Gig' },
  { key: 'hasCertificate', label: 'Has Certificate' },
];

const AnalyticsDashboard = () => {
  // Gig views state
  const [gigViewFilters, setGigViewFilters] = useState({ from: '', to: '', limit: 20 });
  const [gigViewOverview, setGigViewOverview] = useState(null);
  const [topGigViews, setTopGigViews] = useState([]);
  const [selectedGigId, setSelectedGigId] = useState('');
  const [selectedGigTitle, setSelectedGigTitle] = useState('');
  const [timeseriesBucket, setTimeseriesBucket] = useState('day');
  const [gigViewTimeseries, setGigViewTimeseries] = useState([]);
  const [gigViewLoading, setGigViewLoading] = useState(false);
  const [gigViewTimeseriesLoading, setGigViewTimeseriesLoading] = useState(false);
  const [gigViewError, setGigViewError] = useState(null);
  const [gigViewPermissionDenied, setGigViewPermissionDenied] = useState(false);

  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Journey snapshot state
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotTotal, setSnapshotTotal] = useState(0);
  const [snapshotByStage, setSnapshotByStage] = useState({});
  const [snapshotPage, setSnapshotPage] = useState(1);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState(null);
  const [snapshotExporting, setSnapshotExporting] = useState(false);
  const [snapshotFilters, setSnapshotFilters] = useState({
    journeyStage: '',
    isIdentityVerified: '',
    hasProfilePicture: '',
    hasPassedAssessment: '',
    hasPublishedGig: '',
    hasCertificate: '',
    registeredFrom: '',
    registeredTo: '',
  });

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventType: '',
    page: '',
  });

  const loadGigViews = useCallback(async () => {
    setGigViewLoading(true);
    setGigViewError(null);
    try {
      const from = toApiDate(gigViewFilters.from, false);
      const to = toApiDate(gigViewFilters.to, true);

      const [overviewResp, topResp] = await Promise.all([
        fetchGigViewsOverview(from, to),
        fetchTopGigViews(gigViewFilters.limit || 20, from, to),
      ]);

      setGigViewPermissionDenied(false);
      const overviewData = overviewResp?.data || overviewResp || null;
      const topData = topResp?.data || topResp || [];
      const topList = (Array.isArray(topData) ? topData : [])
        .map((item) => ({
          gigId: item?.gigId ?? item?.id ?? item?.gigID ?? '',
          gigTitle: item?.gigTitle ?? item?.title ?? item?.gigName ?? 'Untitled gig',
          views: item?.views ?? item?.totalViews ?? item?.viewCount ?? 0,
          uniqueViewers: item?.uniqueViewers ?? item?.uniqueUsers ?? 0,
          uniqueSessions: item?.uniqueSessions ?? item?.sessions ?? 0,
        }))
        .filter((item) => item.gigId !== '');

      setGigViewOverview(overviewData);
      setTopGigViews(topList);

      if (topList.length > 0) {
        const currentStillExists = topList.some((g) => g.gigId === selectedGigId);
        if (!selectedGigId || !currentStillExists) {
          setSelectedGigId(topList[0].gigId);
          setSelectedGigTitle(topList[0].gigTitle || 'Untitled gig');
        } else {
          const selected = topList.find((g) => g.gigId === selectedGigId);
          setSelectedGigTitle(selected?.gigTitle || 'Untitled gig');
        }
      } else {
        setSelectedGigId('');
        setSelectedGigTitle('');
        setGigViewTimeseries([]);
      }
    } catch (err) {
      const msg = err?.message || 'Failed to load gig views analytics.';
      setGigViewError(msg);
      setGigViewOverview(null);
      setTopGigViews([]);
      setSelectedGigId('');
      setSelectedGigTitle('');
      setGigViewTimeseries([]);
      setGigViewPermissionDenied(msg === 'You do not have analytics access for this dashboard.');
    } finally {
      setGigViewLoading(false);
    }
  }, [gigViewFilters.from, gigViewFilters.limit, gigViewFilters.to, selectedGigId]);

  const loadGigTimeseries = useCallback(async () => {
    if (!selectedGigId || gigViewPermissionDenied) {
      setGigViewTimeseries([]);
      return;
    }

    setGigViewTimeseriesLoading(true);
    setGigViewError(null);
    try {
      const from = toApiDate(gigViewFilters.from, false);
      const to = toApiDate(gigViewFilters.to, true);
      const resp = await fetchGigViewsTimeseries(selectedGigId, timeseriesBucket, from, to);
      const data = resp?.data || resp || {};
      const points = Array.isArray(data.points) ? data.points : (Array.isArray(data) ? data : []);
      setGigViewTimeseries(points.map((point) => ({
        periodStart: point?.periodStart ?? point?.startDate ?? point?.date ?? null,
        periodEnd: point?.periodEnd ?? point?.endDate ?? point?.date ?? null,
        views: point?.views ?? point?.count ?? point?.value ?? 0,
      })));
    } catch (err) {
      const msg = err?.message || 'Failed to load gig views timeseries.';
      setGigViewError(msg);
      setGigViewTimeseries([]);
      setGigViewPermissionDenied(msg === 'You do not have analytics access for this dashboard.');
    } finally {
      setGigViewTimeseriesLoading(false);
    }
  }, [gigViewFilters.from, gigViewFilters.to, gigViewPermissionDenied, selectedGigId, timeseriesBucket]);

  const fetchEvents = useCallback(async (overrides = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        startDate: toApiDate(filters.startDate, false),
        endDate: toApiDate(filters.endDate, true),
        eventType: filters.eventType || undefined,
        page: filters.page || undefined,
        pageNumber,
        pageSize: PAGE_SIZE,
        ...overrides,
      };
      const result = await getAnalyticsEvents(params);
      if (result?.success && result.data) {
        setEvents(Array.isArray(result.data.events) ? result.data.events : []);
        setSummary(result.data.summary || null);
        setTotalCount(result.data.totalCount || 0);
      } else {
        setError('Failed to load analytics events.');
        setEvents([]);
        setSummary(null);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error fetching analytics events:', err);
      setError(err?.message || 'Failed to load analytics events.');
      setEvents([]);
      setSummary(null);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageNumber]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    loadGigViews();
  }, [loadGigViews]);

  useEffect(() => {
    loadGigTimeseries();
  }, [loadGigTimeseries]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPageNumber(1);
    fetchEvents({ pageNumber: 1 });
  };

  const handleReset = () => {
    setFilters({ startDate: '', endDate: '', eventType: '', page: '' });
    setPageNumber(1);
  };

  // ── Snapshot fetch ──────────────────────────────────────
  const fetchSnapshots = useCallback(async (overrides = {}) => {
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const params = { ...snapshotFilters, pageNumber: snapshotPage, pageSize: 50, ...overrides };
      const result = await adminService.getCaregiverSnapshots(params);
      if (result.success) {
        setSnapshots(result.data.snapshots || []);
        setSnapshotTotal(result.data.totalCount || 0);
        setSnapshotByStage(result.data.byJourneyStage || {});
      } else {
        setSnapshotError(result.error || 'Failed to load caregiver journey data');
        setSnapshots([]);
      }
    } catch (err) {
      console.error('Error fetching snapshots:', err);
      setSnapshotError('Failed to load caregiver journey data');
      setSnapshots([]);
    } finally {
      setSnapshotLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotFilters, snapshotPage]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const handleSnapshotFilterChange = (key, value) => {
    setSnapshotFilters(prev => ({ ...prev, [key]: value }));
    setSnapshotPage(1);
  };

  const handleSnapshotReset = () => {
    setSnapshotFilters({
      journeyStage: '', isIdentityVerified: '', hasProfilePicture: '',
      hasPassedAssessment: '', hasPublishedGig: '', hasCertificate: '',
      registeredFrom: '', registeredTo: '',
    });
    setSnapshotPage(1);
  };

  const handleSnapshotExport = async () => {
    setSnapshotExporting(true);
    await adminService.exportCaregiverSnapshots(snapshotFilters);
    setSnapshotExporting(false);
  };

  const snapshotMaxStageCount = Math.max(1, ...Object.values(snapshotByStage));
  const snapshotTotalPages = Math.max(1, Math.ceil(snapshotTotal / 50));

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fbSourcedPct = summary && summary.totalEvents
    ? Math.round((summary.facebookSourcedCount / summary.totalEvents) * 100)
    : 0;

  return (
    <div className="analytics-dashboard">
      <header className="analytics-header">
        <div>
          <h1>Marketing Analytics</h1>
          <p className="analytics-subtitle">
            Track ad campaign performance, page visits, and conversions.
          </p>
        </div>
      </header>

      <section className="gigviews-section">
        <div className="gigviews-header">
          <div>
            <h2 className="gigviews-title">Gig Views Analytics</h2>
            <p className="gigviews-subtitle">Overview, top-performing gigs, and trend analysis</p>
          </div>
        </div>

        <div className="gigviews-filters">
          <div className="analytics-filter-group">
            <label>From</label>
            <input
              type="date"
              value={gigViewFilters.from}
              onChange={(e) => setGigViewFilters(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div className="analytics-filter-group">
            <label>To</label>
            <input
              type="date"
              value={gigViewFilters.to}
              onChange={(e) => setGigViewFilters(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <div className="analytics-filter-group">
            <label>Top limit</label>
            <select
              value={gigViewFilters.limit}
              onChange={(e) => setGigViewFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="analytics-filter-actions">
            <button
              className="analytics-btn analytics-btn-secondary"
              onClick={() => setGigViewFilters({ from: '', to: '', limit: 20 })}
              disabled={gigViewLoading}
            >
              Reset
            </button>
          </div>
        </div>

        {gigViewPermissionDenied && (
          <div className="analytics-error">You do not have analytics access for this dashboard.</div>
        )}

        {!gigViewPermissionDenied && (
          <>
            {gigViewError && <div className="analytics-error">{gigViewError}</div>}

            <div className="gigviews-kpis">
              <div className="gigviews-kpi-card">
                <span className="gigviews-kpi-label">Total Views</span>
                <strong className="gigviews-kpi-value">{((gigViewOverview?.totalViews ?? gigViewOverview?.views ?? 0)).toLocaleString()}</strong>
              </div>
              <div className="gigviews-kpi-card">
                <span className="gigviews-kpi-label">Unique Viewers</span>
                <strong className="gigviews-kpi-value">{((gigViewOverview?.uniqueViewers ?? gigViewOverview?.uniqueUsers ?? 0)).toLocaleString()}</strong>
              </div>
              <div className="gigviews-kpi-card">
                <span className="gigviews-kpi-label">Unique Authenticated Users</span>
                <strong className="gigviews-kpi-value">{((gigViewOverview?.uniqueAuthenticatedUsers ?? gigViewOverview?.authenticatedUsers ?? 0)).toLocaleString()}</strong>
              </div>
              <div className="gigviews-kpi-card">
                <span className="gigviews-kpi-label">Unique Sessions</span>
                <strong className="gigviews-kpi-value">{((gigViewOverview?.uniqueSessions ?? gigViewOverview?.sessions ?? 0)).toLocaleString()}</strong>
              </div>
            </div>

            <div className="gigviews-grid">
              <div className="gigviews-panel">
                <div className="gigviews-panel-header">
                  <h3>Top Gigs by Views</h3>
                </div>
                {gigViewLoading ? (
                  <div className="analytics-loading">Loading gig views…</div>
                ) : topGigViews.length === 0 ? (
                  <div className="analytics-empty">No gig view data found for this range.</div>
                ) : (
                  <div className="analytics-table-wrapper">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Gig</th>
                          <th>Views</th>
                          <th>Unique Viewers</th>
                          <th>Unique Sessions</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topGigViews.map((gig) => (
                          <tr key={gig.gigId} className={selectedGigId === gig.gigId ? 'gigviews-row-active' : ''}>
                            <td>{gig.gigTitle || 'Untitled gig'}</td>
                            <td>{(gig.views || 0).toLocaleString()}</td>
                            <td>{(gig.uniqueViewers || 0).toLocaleString()}</td>
                            <td>{(gig.uniqueSessions || 0).toLocaleString()}</td>
                            <td>
                              <button
                                className="analytics-btn analytics-btn-secondary analytics-btn-sm"
                                onClick={() => {
                                  setSelectedGigId(gig.gigId);
                                  setSelectedGigTitle(gig.gigTitle || 'Untitled gig');
                                }}
                              >
                                View Trend
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="gigviews-panel">
                <div className="gigviews-panel-header gigviews-panel-header-space">
                  <h3>
                    {selectedGigId ? `Trend: ${selectedGigTitle}` : 'Trend'}
                  </h3>
                  <div className="gigviews-bucket-toggle">
                    <button
                      className={`analytics-btn analytics-btn-secondary analytics-btn-sm ${timeseriesBucket === 'day' ? 'is-active' : ''}`}
                      onClick={() => setTimeseriesBucket('day')}
                    >
                      Day
                    </button>
                    <button
                      className={`analytics-btn analytics-btn-secondary analytics-btn-sm ${timeseriesBucket === 'week' ? 'is-active' : ''}`}
                      onClick={() => setTimeseriesBucket('week')}
                    >
                      Week
                    </button>
                  </div>
                </div>

                {selectedGigId === '' ? (
                  <div className="analytics-empty">Choose a gig from the table to view timeseries trend.</div>
                ) : gigViewTimeseriesLoading ? (
                  <div className="analytics-loading">Loading trend…</div>
                ) : gigViewTimeseries.length === 0 ? (
                  <div className="analytics-empty">No trend points available for this gig and date range.</div>
                ) : (
                  <div className="gigviews-timeseries-list">
                    {gigViewTimeseries.map((point, idx) => {
                      const maxValue = Math.max(...gigViewTimeseries.map((p) => p.views || 0), 1);
                      const widthPct = Math.max(6, Math.round(((point.views || 0) / maxValue) * 100));
                      return (
                        <div key={`${point.periodStart || idx}_${point.periodEnd || idx}`} className="gigviews-timeseries-row">
                          <div className="gigviews-timeseries-label">
                            {formatDateLabel(point.periodStart)} - {formatDateLabel(point.periodEnd)}
                          </div>
                          <div className="gigviews-timeseries-bar-track">
                            <div className="gigviews-timeseries-bar-fill" style={{ width: `${widthPct}%` }} />
                          </div>
                          <div className="gigviews-timeseries-value">{(point.views || 0).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Summary cards */}
      <section className="analytics-summary-grid">
        <div className="analytics-card">
          <span className="analytics-card-label">Total events</span>
          <span className="analytics-card-value">
            {summary ? summary.totalEvents.toLocaleString() : '—'}
          </span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card-label">Page views</span>
          <span className="analytics-card-value">
            {summary?.byEventType?.page_view?.toLocaleString() || 0}
          </span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card-label">CTA clicks</span>
          <span className="analytics-card-value">
            {summary?.byEventType?.cta_click?.toLocaleString() || 0}
          </span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card-label">Completed signups</span>
          <span className="analytics-card-value">
            {summary?.byEventType?.signup_complete?.toLocaleString() || 0}
          </span>
        </div>
        <div className="analytics-card analytics-card-highlight">
          <span className="analytics-card-label">Facebook-sourced</span>
          <span className="analytics-card-value">
            {summary ? summary.facebookSourcedCount.toLocaleString() : '—'}
            <span className="analytics-card-pct">{summary ? ` (${fbSourcedPct}%)` : ''}</span>
          </span>
        </div>
      </section>

      {/* Filters */}
      <section className="analytics-filters">
        <div className="analytics-filter-group">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="analytics-filter-group">
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <div className="analytics-filter-group">
          <label htmlFor="eventType">Event type</label>
          <select
            id="eventType"
            value={filters.eventType}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-group">
          <label htmlFor="page">Page</label>
          <select
            id="page"
            value={filters.page}
            onChange={(e) => handleFilterChange('page', e.target.value)}
          >
            {PAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="analytics-filter-actions">
          <button className="analytics-btn analytics-btn-primary" onClick={handleApplyFilters}>
            Apply
          </button>
          <button className="analytics-btn analytics-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
      </section>

      {error && <div className="analytics-error">{error}</div>}

      {/* Events table */}
      <section className="analytics-table-wrapper">
        {isLoading ? (
          <div className="analytics-loading">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="analytics-empty">No events match the selected filters.</div>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Event</th>
                <th>Page</th>
                <th>Source</th>
                <th>IP</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const isFacebook = !!evt.fbclid;
                return (
                  <tr key={evt.id}>
                    <td>{formatDateTime(evt.createdAt)}</td>
                    <td>
                      <span className={`analytics-badge analytics-badge-${evt.eventType}`}>
                        {formatEventType(evt.eventType)}
                      </span>
                    </td>
                    <td>{evt.page || '—'}</td>
                    <td>
                      {isFacebook ? (
                        <span className="analytics-source analytics-source-fb">Facebook</span>
                      ) : (
                        <span className="analytics-source">Direct / Other</span>
                      )}
                    </td>
                    <td className="analytics-mono">{evt.ipAddress || '—'}</td>
                    <td className="analytics-ua" title={evt.userAgent || ''}>
                      {evt.userAgent || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="analytics-pagination">
          <button
            className="analytics-btn analytics-btn-secondary"
            disabled={pageNumber <= 1 || isLoading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span className="analytics-page-info">
            Page {pageNumber} of {totalPages} · {totalCount.toLocaleString()} events
          </span>
          <button
            className="analytics-btn analytics-btn-secondary"
            disabled={pageNumber >= totalPages || isLoading}
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CAREGIVER JOURNEY SNAPSHOT
      ═══════════════════════════════════════════════════ */}
      <section className="snapshot-section">
        <div className="snapshot-section-header">
          <div>
            <h2 className="snapshot-title">Caregiver Journey Funnel</h2>
            <p className="snapshot-subtitle">
              Pre-computed snapshot · refreshes every 15 min · {snapshotTotal.toLocaleString()} caregivers matched
            </p>
          </div>
          <button
            className="analytics-btn analytics-btn-export"
            onClick={handleSnapshotExport}
            disabled={snapshotExporting}
          >
            <i className="fas fa-file-excel"></i>
            {snapshotExporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>

        {/* Funnel bars */}
        <div className="snapshot-funnel">
          {JOURNEY_STAGES.map(stage => {
            const count = snapshotByStage[stage] || 0;
            const pct = Math.round((count / snapshotMaxStageCount) * 100);
            return (
              <div
                key={stage}
                className={`funnel-row${snapshotFilters.journeyStage === stage ? ' funnel-row--active' : ''}`}
                onClick={() => handleSnapshotFilterChange('journeyStage', snapshotFilters.journeyStage === stage ? '' : stage)}
              >
                <span className="funnel-label">{stage}</span>
                <div className="funnel-bar-track">
                  <div
                    className="funnel-bar-fill"
                    style={{ width: `${pct}%`, background: STAGE_COLORS[stage] }}
                  />
                </div>
                <span className="funnel-count">{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Snapshot filters */}
        <div className="snapshot-filters">
          <div className="analytics-filter-group">
            <label>Journey Stage</label>
            <select value={snapshotFilters.journeyStage} onChange={e => handleSnapshotFilterChange('journeyStage', e.target.value)}>
              <option value="">All stages</option>
              {JOURNEY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {SNAPSHOT_BOOL_FILTERS.map(({ key, label }) => (
            <div key={key} className="analytics-filter-group">
              <label>{label}</label>
              <select value={snapshotFilters[key]} onChange={e => handleSnapshotFilterChange(key, e.target.value)}>
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          ))}
          <div className="analytics-filter-group">
            <label>Registered from</label>
            <input type="date" value={snapshotFilters.registeredFrom} onChange={e => handleSnapshotFilterChange('registeredFrom', e.target.value)} />
          </div>
          <div className="analytics-filter-group">
            <label>Registered to</label>
            <input type="date" value={snapshotFilters.registeredTo} onChange={e => handleSnapshotFilterChange('registeredTo', e.target.value)} />
          </div>
          <div className="analytics-filter-actions">
            <button className="analytics-btn analytics-btn-secondary" onClick={handleSnapshotReset}>Reset</button>
          </div>
        </div>

        {snapshotError && <div className="analytics-error">{snapshotError}</div>}

        {/* Snapshot table */}
        <div className="analytics-table-wrapper">
          {snapshotLoading ? (
            <div className="analytics-loading">Loading journey data…</div>
          ) : snapshots.length === 0 ? (
            <div className="analytics-empty">No caregivers match the selected filters.</div>
          ) : (
            <table className="analytics-table snapshot-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Stage</th>
                  <th>Verified</th>
                  <th>Assessment</th>
                  <th>Certs</th>
                  <th>Gigs (pub)</th>
                  <th>Profile Pic</th>
                  <th>Auth</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map(s => (
                  <tr key={s.caregiverId}>
                    <td><strong>{s.firstName} {s.lastName}</strong></td>
                    <td className="analytics-mono">{s.email}</td>
                    <td>{[s.serviceCity, s.serviceState].filter(Boolean).join(', ') || '—'}</td>
                    <td>
                      <span className="snapshot-stage-badge" style={{ background: STAGE_COLORS[s.journeyStage] + '22', color: STAGE_COLORS[s.journeyStage], borderColor: STAGE_COLORS[s.journeyStage] }}>
                        {s.journeyStage}
                      </span>
                    </td>
                    <td>{s.isIdentityVerified ? <span className="snapshot-yes">✓</span> : <span className="snapshot-no">✗</span>}</td>
                    <td>
                      {s.hasPassedAnyAssessment
                        ? <span className="snapshot-yes">✓ {s.latestAssessmentScore != null ? `(${s.latestAssessmentScore}%)` : ''}</span>
                        : <span className="snapshot-no">✗</span>}
                    </td>
                    <td>{s.certificatesUploadedCount}/{s.certificatesVerifiedCount} verified</td>
                    <td>{s.gigsPublishedCount} / {s.gigsDraftCount} draft</td>
                    <td>{s.hasProfilePicture ? <span className="snapshot-yes">✓</span> : <span className="snapshot-no">✗</span>}</td>
                    <td>{s.authProvider}</td>
                    <td>{s.caregiverCreatedAt ? new Date(s.caregiverCreatedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Snapshot pagination */}
        {snapshotTotal > 50 && (
          <div className="analytics-pagination">
            <button className="analytics-btn analytics-btn-secondary" disabled={snapshotPage <= 1 || snapshotLoading} onClick={() => setSnapshotPage(p => Math.max(1, p - 1))}>← Previous</button>
            <span className="analytics-page-info">Page {snapshotPage} of {snapshotTotalPages} · {snapshotTotal.toLocaleString()} caregivers</span>
            <button className="analytics-btn analytics-btn-secondary" disabled={snapshotPage >= snapshotTotalPages || snapshotLoading} onClick={() => setSnapshotPage(p => Math.min(snapshotTotalPages, p + 1))}>Next →</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
