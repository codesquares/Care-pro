import { useState, useEffect, useCallback } from 'react';
import { getAnalyticsEvents } from '../../../services/analyticsService';
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

const formatEventType = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const AnalyticsDashboard = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventType: '',
    page: '',
  });

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
      setError(err?.response?.data?.message || 'Failed to load analytics events.');
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
    </div>
  );
};

export default AnalyticsDashboard;
