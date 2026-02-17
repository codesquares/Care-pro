import { useNavigate } from 'react-router-dom';
import SubscriptionBadge from './SubscriptionBadge';
import SubscriptionService from '../../services/subscriptionService';
import './SubscriptionCard.css';

/**
 * A card representing a single subscription in a list view.
 * @param {{ subscription: Object, basePath: string }} props
 */
const SubscriptionCard = ({ subscription, basePath = '/app/client' }) => {
  const navigate = useNavigate();
  const s = subscription;

  const cardDisplay = SubscriptionService.formatCardDisplay(s.cardBrand, s.cardLastFour);
  const nextDate = s.nextChargeDate ? new Date(s.nextChargeDate).toLocaleDateString() : '—';
  const periodEnd = s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—';

  return (
    <div
      className="subscription-card"
      onClick={() => navigate(`${basePath}/subscriptions/${s.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`${basePath}/subscriptions/${s.id}`)}
    >
      <div className="subscription-card__header">
        <h3 className="subscription-card__title">{s.gigTitle || 'Subscription'}</h3>
        <SubscriptionBadge status={s.status} />
      </div>

      <div className="subscription-card__body">
        <div className="subscription-card__row">
          <span className="subscription-card__label">Billing Cycle</span>
          <span className="subscription-card__value">{s.billingCycle || '—'}</span>
        </div>
        <div className="subscription-card__row">
          <span className="subscription-card__label">Amount</span>
          <span className="subscription-card__value">₦{(s.recurringAmount || 0).toLocaleString()}</span>
        </div>
        <div className="subscription-card__row">
          <span className="subscription-card__label">Payment Method</span>
          <span className="subscription-card__value">{cardDisplay}</span>
        </div>

        {s.status === 'Active' && (
          <div className="subscription-card__row">
            <span className="subscription-card__label">Next Charge</span>
            <span className="subscription-card__value">{nextDate}</span>
          </div>
        )}

        {s.status === 'PendingCancellation' && (
          <div className="subscription-card__banner subscription-card__banner--warn">
            Service continues until {periodEnd}
          </div>
        )}

        {s.status === 'Suspended' && (
          <div className="subscription-card__banner subscription-card__banner--error">
            Subscription suspended — update payment method
          </div>
        )}

        {s.status === 'PastDue' && (
          <div className="subscription-card__banner subscription-card__banner--orange">
            Payment failed, retrying…
          </div>
        )}

        {s.status === 'Paused' && (
          <div className="subscription-card__banner subscription-card__banner--gray">
            Subscription paused
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
