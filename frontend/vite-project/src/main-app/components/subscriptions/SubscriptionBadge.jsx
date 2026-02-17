import SubscriptionService from '../../services/subscriptionService';
import './SubscriptionBadge.css';

/**
 * Subscription status badge component.
 * Renders a colored badge based on subscription status.
 * @param {{ status: string, size?: 'sm' | 'md' | 'lg' }} props
 */
const SubscriptionBadge = ({ status, size = 'md' }) => {
  const { className, label } = SubscriptionService.getStatusBadgeInfo(status);

  return (
    <span className={`sub-badge ${className} sub-badge--${size}`}>
      {label}
    </span>
  );
};

export default SubscriptionBadge;
