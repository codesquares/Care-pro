import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const STATUS_STYLES = {
  pending:        { background: '#fff8e1', color: '#e65100' },
  completed:      { background: '#e8f5e9', color: '#1b5e20' },
  failed:         { background: '#fdecea', color: '#b71c1c' },
  expired:        { background: '#f5f5f5', color: '#616161' },
  amountmismatch: { background: '#fce4ec', color: '#880e4f' },
};

const STATUS_LABELS = {
  pending:        'Pending',
  completed:      'Completed',
  failed:         'Failed',
  expired:        'Expired',
  amountmismatch: 'Amount Mismatch',
};

const FILTERS = ['All', 'pending', 'completed', 'failed', 'expired', 'amountmismatch'];

const statusBadge = (status) => {
  const key = (status || '').toLowerCase();
  const style = STATUS_STYLES[key] || { background: '#f5f5f5', color: '#555' };
  return (
    <span style={{ ...style, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {STATUS_LABELS[key] || status || '—'}
    </span>
  );
};

const ClientBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/booking-commitment/client');
        const data = res.data;
        setBookings(Array.isArray(data) ? data : data?.items || data?.Items || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load booking commitments.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = filter === 'All'
    ? bookings
    : bookings.filter((b) => (b.status || b.Status || '').toLowerCase() === filter);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 700, color: '#1a1a2e' }}>
          Booking Commitments
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          Your booking commitment payments and their statuses.
        </p>
      </div>

      {/* Filter tabs */}
      {!loading && !error && bookings.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                cursor: 'pointer',
                padding: '0.4rem 1rem',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filter === f ? '#00B4A6' : '#ddd',
                background: filter === f ? '#00B4A6' : '#fff',
                color: filter === f ? '#fff' : '#444',
                fontSize: 13,
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f === 'amountmismatch' ? 'Mismatch' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>Loading bookings…</div>
      )}

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #ef9a9a', borderRadius: 8, padding: '1rem', color: '#b71c1c', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>⏰</div>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {filter === 'All' ? 'No booking commitments found.' : `No ${filter} commitments.`}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {filtered.map((b) => {
            const id = b.id || b.Id;
            const amount = b.amount || b.Amount || 0;
            const status = b.status || b.Status || '';
            const createdAt = b.createdAt || b.CreatedAt;
            const completedAt = b.completedAt || b.CompletedAt;
            const appliedOrderId = b.appliedToOrderId || b.AppliedToOrderId;
            const isApplied = b.isAppliedToOrder || b.IsAppliedToOrder;

            return (
              <div
                key={id}
                style={{ background: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#00B4A6', marginBottom: 6 }}>
                      ₦{Number(amount).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {statusBadge(status)}
                      {isApplied && (
                        <span style={{ background: '#e3f2fd', color: '#0d47a1', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          Applied to Order
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, color: '#888' }}>
                    <div>Created: {formatDate(createdAt)}</div>
                    {completedAt && <div>Completed: {formatDate(completedAt)}</div>}
                  </div>
                </div>

                {appliedOrderId && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: 13, color: '#555' }}>Linked order:</span>
                    <button
                      onClick={() => navigate(`/app/client/my-order/${appliedOrderId}`)}
                      style={{ cursor: 'pointer', padding: '0.3rem 0.85rem', borderRadius: 6, border: '1px solid #00B4A6', background: 'transparent', color: '#00B4A6', fontSize: 13, fontWeight: 600 }}
                    >
                      View Order
                    </button>
                  </div>
                )}

                {(b.transactionReference || b.TransactionReference) && (
                  <div style={{ marginTop: '0.5rem', fontSize: 12, color: '#aaa' }}>
                    Ref: {b.transactionReference || b.TransactionReference}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientBookings;
