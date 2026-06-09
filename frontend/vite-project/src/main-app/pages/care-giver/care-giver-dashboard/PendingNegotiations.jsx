import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GigPriceNegotiationService from '../../../services/gigPriceNegotiationService';
import './PendingNegotiations.css';

const formatPerVisitPrice = (amount) => {
  if (amount == null) return '—';
  return `₦${Number(amount).toLocaleString()} / visit`;
};

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiring';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join('')
    .slice(0, 2);
};

const PendingNegotiations = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    GigPriceNegotiationService.getCaregiverPending({ page: 1, pageSize: 5 })
      .then((result) => {
        if (!mounted) return;
        const list = Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result)
            ? result
            : [];
        setItems(list);
        setTotalCount(result?.totalCount ?? list.length);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="pn-widget">
        <div className="pn-header">
          <h2 className="pn-title">Price Negotiations</h2>
        </div>
        <div className="pn-loading">Loading negotiations…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pn-widget">
        <div className="pn-header">
          <h2 className="pn-title">Price Negotiations</h2>
        </div>
        <p className="pn-empty">No pending negotiations right now.</p>
      </div>
    );
  }

  return (
    <div className="pn-widget">
      <div className="pn-header">
        <h2 className="pn-title">Price Negotiations</h2>
        {totalCount > 0 && (
          <span className="pn-count-badge">{totalCount}</span>
        )}
      </div>

      <ul className="pn-list">
        {items.map((item) => (
          <li
            key={item.negotiationId}
            className="pn-card"
            onClick={() => navigate(`/app/caregiver/price-negotiation/${item.negotiationId}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/app/caregiver/price-negotiation/${item.negotiationId}`);
              }
            }}
          >
            {/* Client avatar */}
            <div className="pn-avatar">
              {item.clientProfileImage ? (
                <img src={item.clientProfileImage} alt={item.clientName || 'Client'} />
              ) : (
                <span>{getInitials(item.clientName)}</span>
              )}
            </div>

            {/* Main info */}
            <div className="pn-info">
              <div className="pn-client-name">{item.clientName || 'Client'}</div>
              <div className="pn-gig-title">{item.gigTitle}</div>
              <div className="pn-price-row">
                <span className="pn-price">{formatPerVisitPrice(item.currentProposedPrice)}</span>
                <span className="pn-proposed-by">by {item.proposedBy}</span>
              </div>
            </div>

            {/* Right side: timer + arrow */}
            <div className="pn-meta">
              {item.expiresAt && (
                <span className="pn-timer">{formatTimeLeft(item.expiresAt)}</span>
              )}
              <span className="pn-arrow">›</span>
            </div>
          </li>
        ))}
      </ul>

      {totalCount > items.length && (
        <button
          className="pn-view-all"
          onClick={() => navigate('/app/caregiver/notifications')}
        >
          View all {totalCount} negotiations →
        </button>
      )}
    </div>
  );
};

export default PendingNegotiations;
