import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const SEVERITY_STYLES = {
  Low:      { background: '#e8f4fd', color: '#1565c0', border: '1px solid #90caf9' },
  Medium:   { background: '#fff8e1', color: '#e65100', border: '1px solid #ffcc02' },
  High:     { background: '#fdecea', color: '#b71c1c', border: '1px solid #ef9a9a' },
  Critical: { background: '#b71c1c', color: '#fff',    border: '1px solid #7f0000' },
};

const IncidentReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/incident-reports/${id}`);
        setReport(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load incident report.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const severityStyle = report?.severity ? SEVERITY_STYLES[report.severity] || {} : {};

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>
        Loading incident report…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ background: '#fdecea', border: '1px solid #ef9a9a', borderRadius: 8, padding: '1rem', color: '#b71c1c', marginBottom: '1rem' }}>
          {error}
        </div>
        <button onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: '0.5rem 1.25rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
          ← Back
        </button>
      </div>
    );
  }

  if (!report) return null;

  const field = (label, value) =>
    value !== undefined && value !== null && value !== '' ? (
      <div style={{ marginBottom: '0.85rem' }}>
        <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <div style={{ marginTop: 3, color: '#222', wordBreak: 'break-word' }}>{String(value)}</div>
      </div>
    ) : null;

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ cursor: 'pointer', padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff', fontSize: 14 }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e' }}>Incident Report</h2>
        {report.severity && (
          <span style={{ ...severityStyle, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {report.severity}
          </span>
        )}
      </div>

      {/* Main card */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {field('Report ID', report.id || report.Id)}
        {field('Order ID', report.orderId || report.OrderId)}
        {field('Task Sheet ID', report.taskSheetId || report.TaskSheetId)}
        {field('Reported By', report.reportedBy || report.ReportedBy || report.reportedByName)}
        {field('Report Type', report.reportType || report.ReportType || report.type)}
        {field('Status', report.status || report.Status)}
        {field('Created At', formatDate(report.createdAt || report.CreatedAt))}
        {field('Updated At', formatDate(report.updatedAt || report.UpdatedAt))}

        {(report.description || report.Description) && (
          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Description</span>
            <div style={{ marginTop: 6, color: '#222', background: '#f9f9f9', borderRadius: 6, padding: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {report.description || report.Description}
            </div>
          </div>
        )}

        {(report.adminNotes || report.AdminNotes) && (
          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Notes</span>
            <div style={{ marginTop: 6, color: '#333', background: '#fffde7', borderRadius: 6, padding: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {report.adminNotes || report.AdminNotes}
            </div>
          </div>
        )}

        {/* Render any additional unknown fields */}
        {Object.entries(report)
          .filter(([k]) => ![
            'id','Id','orderId','OrderId','taskSheetId','TaskSheetId',
            'reportedBy','ReportedBy','reportedByName','reportType','ReportType','type',
            'status','Status','severity','Severity','createdAt','CreatedAt',
            'updatedAt','UpdatedAt','description','Description','adminNotes','AdminNotes',
          ].includes(k))
          .map(([k, v]) =>
            v !== null && v !== undefined && typeof v !== 'object'
              ? field(k.replace(/([A-Z])/g, ' $1').trim(), v)
              : null
          )}
      </div>
    </div>
  );
};

export default IncidentReportDetail;
