import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingCommitmentService from '../services/bookingCommitmentService';
import './PendingCommitmentBanner.css';

/**
 * Surfaces an incomplete ₦5,000 booking-commitment payment outside of
 * CommitmentSuccess.jsx, so a client who abandoned that tab (it polls
 * indefinitely with no timeout and nothing else in the app pointed back to it)
 * has a way back in. Pure UI consumption of the already-existing
 * GET /booking-commitment/client endpoint — no new backend work.
 */
const PendingCommitmentBanner = () => {
  const [pending, setPending] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await bookingCommitmentService.getClientCommitments();
      if (cancelled || !result.success) return;
      const found = (result.data || []).find((c) => c.status === 'pending');
      setPending(found || null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!pending) return null;

  return (
    <div className="pending-commitment-banner">
      <span className="pending-commitment-banner__text">
        You have a pending ₦5,000 payment.
      </span>
      <button
        className="pending-commitment-banner__btn"
        onClick={() => navigate(`/app/client/commitment-success?tx_ref=${encodeURIComponent(pending.transactionReference)}`)}
      >
        Resume Payment
      </button>
    </div>
  );
};

export default PendingCommitmentBanner;
