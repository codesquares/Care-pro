import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionService from '../../../services/subscriptionService';
import SubscriptionCard from '../../../components/subscriptions/SubscriptionCard';
import './CaregiverSubscriptions.css';

const CaregiverSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await SubscriptionService.getCaregiverSubscriptions();
      if (result.success) {
        const items = Array.isArray(result.data) ? result.data : [];
        setSubscriptions(items);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="cg-subs-page">
        <div className="cg-subs-container">
          <div className="cg-subs__loading">Loading subscriptions…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cg-subs-page">
      <div className="cg-subs-container">
        <h1 className="cg-subs__title">Client Subscriptions</h1>
        <p className="cg-subs__subtitle">Recurring subscriptions linked to your services</p>

        {error && <div className="cg-subs__error">{error}</div>}

        {subscriptions.length === 0 ? (
          <div className="cg-subs__empty">
            <p>No client subscriptions yet.</p>
          </div>
        ) : (
          <div className="cg-subs__list">
            {subscriptions.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} basePath="/app/caregiver" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaregiverSubscriptions;
