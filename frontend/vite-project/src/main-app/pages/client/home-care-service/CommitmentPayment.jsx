import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingCommitmentService, { COMMITMENT_AMOUNT } from '../../../services/bookingCommitmentService';
import ClientGigService from '../../../services/clientGigService';
import defaultAvatar from '../../../../assets/profilecard1.png';
import './CommitmentPayment.css';

const CommitmentPayment = () => {
  const { id } = useParams(); // gigId
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const allGigs = await ClientGigService.getAllGigs();
        const gig = allGigs.find((g) => g.id === id);
        if (!gig) throw new Error('Service not found');
        setService(gig);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id]);

  const handleProceed = async () => {
    if (!service) return;
    setPaying(true);
    setError(null);

    const user = JSON.parse(localStorage.getItem('userDetails') || '{}');

    if (user?.id && service.caregiverId === user.id) {
      setError('You cannot pay a commitment fee for your own gig.');
      setPaying(false);
      return;
    }

    const result = await bookingCommitmentService.initiatePayment({
      gigId: id,
      email: user?.email,
      redirectUrl: `${window.location.origin}/app/client/commitment-success`,
    });

    setPaying(false);

    if (!result.success) {
      setError(result.error || 'Failed to initiate payment. Please try again.');
      return;
    }

    // Already unlocked — go straight to chat
    if (result.alreadyUnlocked) {
      navigate(`/app/client/message/${service.caregiverId}`, {
        state: { recipientName: service.caregiverName, serviceId: id },
      });
      return;
    }

    const data = result.data;
    if (data.paymentLink) {
      localStorage.setItem('commitmentTxRef', data.transactionReference);
      localStorage.setItem('commitmentGigId', id);
      localStorage.setItem('commitmentCaregiverName', service.caregiverName || '');
      window.location.href = data.paymentLink;
    } else {
      setError('No payment link returned. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-container">
          <div className="cp-card cp-card--loading">
            <div className="cp-spinner" />
            <p>Loading service details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="cp-page">
        <div className="cp-container">
          <div className="cp-card">
            <h2>Service not found</h2>
            <p>{error || 'The service you are looking for is no longer available.'}</p>
            <button className="cp-btn cp-btn--secondary" onClick={() => navigate('/app/client/dashboard')}>
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  const caregiverName = service.caregiverName || 'Caregiver';
  const caregiverFirst = caregiverName.split(' ')[0];
  const profileImg = service.caregiverProfileImage;
  const hasValidImg = profileImg && (profileImg.startsWith('http') || profileImg.startsWith('/'));

  return (
    <div className="cp-page">
      <div className="cp-container">
        <div className="cp-card">
          {/* Header */}
          <div className="cp-header">
            <div className="cp-avatar-wrap">
              <img
                src={hasValidImg ? profileImg : defaultAvatar}
                alt={caregiverName}
                className="cp-avatar"
                onError={(e) => { e.target.src = defaultAvatar; }}
              />
            </div>
            <h1 className="cp-title">Connect with {caregiverFirst}</h1>
            <p className="cp-service-name">{service.title}</p>
          </div>

          {/* Explanation */}
          <div className="cp-explanation">
            <h2 className="cp-explanation-title">What is the Commitment Fee?</h2>
            <p className="cp-explanation-text">
              To start a conversation with <strong>{caregiverFirst}</strong>, a one-time
              <strong> non-refundable</strong> commitment fee of <strong>₦{COMMITMENT_AMOUNT.toLocaleString()}</strong> is required.
              This ensures serious enquiries and protects caregivers’ time.
            </p>
          </div>

          {/* How it works */}
          <div className="cp-steps">
            <h3 className="cp-steps-title">How it works</h3>

            <div className="cp-step">
              <div className="cp-step-num">1</div>
              <div className="cp-step-content">
                <strong>Pay the commitment fee</strong>
                <span>A one-time, non-refundable ₦{COMMITMENT_AMOUNT.toLocaleString()} payment to unlock direct messaging with {caregiverFirst}.</span>
              </div>
            </div>

            <div className="cp-step">
              <div className="cp-step-num">2</div>
              <div className="cp-step-content">
                <strong>Discuss your care needs</strong>
                <span>Chat directly with {caregiverFirst}, ask questions, share your requirements, and reach an agreement.</span>
              </div>
            </div>

            <div className="cp-step">
              <div className="cp-step-num">3</div>
              <div className="cp-step-content">
                <strong>Hire when you’re ready</strong>
                <span>Once you’ve both agreed, click <em>“Hire Me”</em> in the chat to place your order. The ₦{COMMITMENT_AMOUNT.toLocaleString()} fee will be deducted from your order total so you only pay the balance.</span>
              </div>
            </div>
          </div>

          {/* Fee highlight */}
          <div className="cp-fee-box">
            <div className="cp-fee-row">
              <span>Commitment Fee</span>
              <span className="cp-fee-amount">₦{COMMITMENT_AMOUNT.toLocaleString()}</span>
            </div>
            <p className="cp-fee-note">
              If you hire {caregiverFirst}, this fee is <strong>deducted from your order total</strong> — you only pay the balance.
              If you choose not to hire, the fee is <strong>non-refundable</strong>.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="cp-error">{error}</div>
          )}

          {/* Actions */}
          <div className="cp-actions">
            <button
              className="cp-btn cp-btn--primary"
              onClick={handleProceed}
              disabled={paying}
            >
              {paying ? 'Redirecting to payment...' : `Proceed to Pay ₦${COMMITMENT_AMOUNT.toLocaleString()}`}
            </button>
            <button
              className="cp-btn cp-btn--secondary"
              onClick={() => navigate(`/service/${id}`)}
            >
              ← Back to Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitmentPayment;
