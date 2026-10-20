import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PackageSubscriptionService, { formatNaira, formatDate, billingNote } from '../../../services/packageSubscriptionService';
import SubscriptionBadge from '../../../components/subscriptions/SubscriptionBadge';
import '../client-dashboard/marketplaceHero.css';
import './ClientSubscriptions.css';

const ClientSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const result = await PackageSubscriptionService.list();
      if (result.success) {
        setSubscriptions(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Could not load your subscriptions.');
      }
      setLoading(false);
    };
    load();
  }, []);

  const active = subscriptions.filter((s) => s.status === 'Active' || s.status === 'PastDue');
  const monthlyTotal = active.reduce((sum, s) => sum + (s.recurringAmount || 0), 0);
  const upcoming = active
    .filter((s) => s.nextChargeDate)
    .sort((a, b) => new Date(a.nextChargeDate) - new Date(b.nextChargeDate))[0];

  return (
    <div className="client-subs-page">
      <div className="marketplace-banner client-subs__banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">My Subscriptions</h1>
        </div>
        <p className="client-subs__banner-sub">Care packages that renew automatically each month</p>
      </div>

      <div className="client-subs-container">
        {loading ? (
          <div className="client-subs__loading">Loading subscriptions…</div>
        ) : (
          <>
            {error && <div className="client-subs__error" role="alert">{error}</div>}

            {subscriptions.length > 0 && (
              <div className="client-subs__summary">
                <div className="client-subs__stat-card">
                  <span className="client-subs__stat-label">Active</span>
                  <span className="client-subs__stat-value">{active.length}</span>
                </div>
                <div className="client-subs__stat-card">
                  <span className="client-subs__stat-label">Monthly total</span>
                  <span className="client-subs__stat-value">{formatNaira(monthlyTotal)}</span>
                </div>
                <div className="client-subs__stat-card">
                  <span className="client-subs__stat-label">Next charge</span>
                  <span className="client-subs__stat-value">{upcoming ? formatDate(upcoming.nextChargeDate) : '—'}</span>
                </div>
              </div>
            )}

            {subscriptions.length === 0 && !error ? (
              <div className="client-subs__empty">
                <p>You have no recurring subscriptions. If you chose monthly billing, it will appear here after your payment is confirmed.</p>
                <button className="client-subs__browse-btn" onClick={() => navigate('/app/client/requests')}>
                  View my package requests
                </button>
              </div>
            ) : (
              <div className="client-subs__list">
                {subscriptions.map((s) => {
                  const note = billingNote(s);
                  return (
                    <div
                      key={s.id}
                      className="pkg-sub-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/app/client/subscriptions/${s.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/client/subscriptions/${s.id}`)}
                    >
                      <div className="pkg-sub-card__header">
                        <div>
                          <h3 className="pkg-sub-card__title">{s.packageCategory || 'Care package'}</h3>
                          {s.packageTierLabel && <p className="pkg-sub-card__tier">{s.packageTierLabel}</p>}
                        </div>
                        <SubscriptionBadge status={s.status} />
                      </div>
                      <div className="pkg-sub-card__row">
                        <span>Each month</span>
                        <strong>{formatNaira(s.recurringAmount)}</strong>
                      </div>
                      <div className="pkg-sub-card__row">
                        <span>Payment method</span>
                        <span>{s.hasSavedCard ? `${s.cardBrand || 'Card'} •••• ${s.cardLastFour || ''}`.trim() : 'No card saved'}</span>
                      </div>
                      <div className={`pkg-sub-note pkg-sub-note--${note.tone}`}>{note.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientSubscriptions;
