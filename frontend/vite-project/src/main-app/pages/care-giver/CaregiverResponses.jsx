import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLORS = {
  pending:     { background: '#fff8e1', color: '#e65100' },
  shortlisted: { background: '#e8f5e9', color: '#1b5e20' },
  accepted:    { background: '#e3f2fd', color: '#0d47a1' },
  rejected:    { background: '#fdecea', color: '#b71c1c' },
  withdrawn:   { background: '#f5f5f5', color: '#616161' },
};

const REQUEST_STATUS_COLORS = {
  open:   { background: '#e8f5e9', color: '#1b5e20' },
  paused: { background: '#fff8e1', color: '#e65100' },
  closed: { background: '#fdecea', color: '#b71c1c' },
};

const statusBadge = (status, colorMap) => {
  const lower = (status || '').toLowerCase();
  const style = colorMap[lower] || { background: '#f5f5f5', color: '#555' };
  return (
    <span style={{ ...style, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {status || '—'}
    </span>
  );
};

const CaregiverResponses = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/care-requests/caregiver/my-responses');
        const data = res.data;
        setResponses(Array.isArray(data) ? data : data?.items || data?.Items || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load your responses.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 700, color: '#1a1a2e' }}>
          My Care Request Responses
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          Track all care requests you have responded to.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>Loading responses…</div>
      )}

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #ef9a9a', borderRadius: 8, padding: '1rem', color: '#b71c1c', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && responses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🔍</div>
          <p style={{ margin: 0, fontWeight: 500 }}>You have not responded to any care requests yet.</p>
          <button
            onClick={() => navigate('/app/caregiver/client-requests')}
            style={{ marginTop: '1.25rem', cursor: 'pointer', padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: '#00B4A6', color: '#fff', fontWeight: 600, fontSize: 14 }}
          >
            Browse Open Requests
          </button>
        </div>
      )}

      {!loading && responses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {responses.map((r) => (
            <div
              key={r.responseId || r.ResponseId || r.id}
              style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
                    {r.careRequestTitle || r.CareRequestTitle || 'Care Request'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Request status:</span>
                    {statusBadge(r.careRequestStatus || r.CareRequestStatus, REQUEST_STATUS_COLORS)}
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>Your response:</span>
                    {statusBadge(r.responseStatus || r.ResponseStatus, STATUS_COLORS)}
                  </div>
                </div>
                {(r.proposedRate || r.ProposedRate) && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#888' }}>Proposed Rate</div>
                    <div style={{ fontWeight: 700, color: '#00B4A6', fontSize: 16 }}>
                      ₦{Number(r.proposedRate || r.ProposedRate).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {(r.message || r.Message) && (
                <div style={{ background: '#f9f9f9', borderRadius: 6, padding: '0.65rem 0.75rem', color: '#444', fontSize: 14, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {r.message || r.Message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
                <span>Responded: {formatDate(r.respondedAt || r.RespondedAt)}</span>
                {(r.shortlistedAt || r.ShortlistedAt) && (
                  <span>Shortlisted: {formatDate(r.shortlistedAt || r.ShortlistedAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverResponses;
