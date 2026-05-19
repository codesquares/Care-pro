import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const CaregiverProfileReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const userId = currentUser?.id;
    if (!userId) {
      setError('Could not determine user ID.');
      setLoading(false);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/reviews/caregiver/${userId}`);
        const data = res.data;
        setReviews(Array.isArray(data) ? data : data?.items || data?.Items || data?.reviews || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const renderStars = (rating) => {
    const r = Math.round(Number(rating) || 0);
    return (
      <span>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < r ? '#f59e0b' : '#d1d5db', fontSize: 16 }}>★</span>
        ))}
      </span>
    );
  };

  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || r.Rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/app/caregiver/profile')}
          style={{ cursor: 'pointer', padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #ccc', background: '#fff', fontSize: 14 }}
        >
          ← Profile
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e' }}>All Reviews</h2>
          {avg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
              {renderStars(avg)}
              <span style={{ fontSize: 14, color: '#444', fontWeight: 600 }}>{avg}</span>
              <span style={{ fontSize: 13, color: '#888' }}>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>Loading reviews…</div>
      )}

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #ef9a9a', borderRadius: 8, padding: '1rem', color: '#b71c1c', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>⭐</div>
          <p style={{ margin: 0, fontWeight: 500 }}>No reviews yet. Complete orders to receive your first review.</p>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((r, idx) => {
            const rating = r.rating || r.Rating;
            const comment = r.comment || r.Comment || r.review || r.Review || r.text || r.Text;
            const reviewer = r.clientName || r.ClientName || r.reviewerName || r.ReviewerName || 'Client';
            const date = r.createdAt || r.CreatedAt || r.reviewedAt || r.ReviewedAt;
            const gigTitle = r.gigTitle || r.GigTitle || r.serviceName || r.ServiceName;

            return (
              <div
                key={r.id || r.Id || idx}
                style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{reviewer}</div>
                    {gigTitle && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{gigTitle}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {rating && renderStars(rating)}
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{formatDate(date)}</div>
                  </div>
                </div>
                {comment && (
                  <p style={{ margin: 0, color: '#444', fontSize: 14, lineHeight: 1.65 }}>{comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CaregiverProfileReviews;
