import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import bookingCommitmentService from '../../../services/bookingCommitmentService';
import api from '../../../services/api';
import paymentReceiptService from '../../../services/paymentReceiptService';
import { toast } from 'react-toastify';
import './CommitmentSuccess.css';

const CommitmentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const autoMessageSentRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Verifying payment...');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const [receiptDownloading, setReceiptDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    const txRef = paymentData?.transactionReference;
    if (!txRef) return;
    setReceiptDownloading(true);
    const result = await paymentReceiptService.downloadCommitmentReceipt(txRef);
    setReceiptDownloading(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to download receipt.', { containerId: 'main-toast-container' });
    }
  };

  // Get transaction reference from URL or localStorage
  const txRef = searchParams.get("tx_ref") || localStorage.getItem("commitmentTxRef");
  const status = searchParams.get("status");

  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

  const buildUnlockContext = (gigId, caregiverId, transactionReference) => ({
    source: 'commitment_success',
    gigId: gigId || null,
    caregiverId: caregiverId || null,
    transactionReference: transactionReference || null,
    issuedAt: new Date().toISOString(),
  });

  // Send the automatic first message after unlock — fires silently in the background
  // to open the chat thread and notify the caregiver (they cannot message first).
  // The client is navigated straight to chat so the gig banner is shown immediately.
  const sendAutoFirstMessage = async (caregiverId, caregiverName) => {
    if (autoMessageSentRef.current) return; // Only send once
    autoMessageSentRef.current = true;

    const greeting = `Hello ${caregiverName || 'there'}, can we discuss my care needs now?`;
    const gigId = localStorage.getItem('commitmentGigId');
    const unlockContext = buildUnlockContext(gigId, caregiverId, txRef);

    // Navigate immediately so the client sees the chat banner right away
    navigate(`/app/client/message/${caregiverId}`, {
      state: {
        recipientName: caregiverName,
        autoUnlocked: true,
        serviceId: gigId || undefined,
        unlockContext,
      },
    });

    // Fire the thread-opener silently after navigation (best-effort)
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !user?.id) return;
      await api.post('/Chat/send', {
        SenderId: user.id,
        ReceiverId: caregiverId,
        Message: greeting,
        Timestamp: new Date().toISOString(),
        senderId: user.id,
        receiverId: caregiverId,
        message: greeting,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to auto-send thread-opener message:', err);
      // Non-critical — client is already in chat and can message manually
    }
  };

  useEffect(() => {
    if (!txRef) {
      setError("No transaction reference found");
      setStatusMessage('Payment verification failed');
      return;
    }

    // Handle cancelled payments immediately
    if (status === "cancelled") {
      setError("Payment was cancelled. No charges were made.");
      setStatusMessage('Payment cancelled');
      cleanupLocalStorage();
      return;
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const checkPaymentStatus = async () => {
      try {
        setStatusMessage('Verifying commitment payment...');

        const result = await bookingCommitmentService.getPaymentStatus(txRef);

        if (!result.success) {
          throw new Error(result.error || "Failed to verify payment status");
        }

        const data = result.data;
        console.log("Commitment Payment Status:", data);

        if (data.success && data.status === "completed") {
          stopPolling();
          setPaymentData(data);
          setStatusMessage('Payment verified! Chat access unlocked.');

          // Read gigId BEFORE cleanupLocalStorage removes it — needed for the chat banner
          const caregiverName = localStorage.getItem('commitmentCaregiverName') || '';
          if (data.caregiverId) {
            sendAutoFirstMessage(data.caregiverId, caregiverName);
          }
          cleanupLocalStorage();

        } else if (data.status === "pending") {
          setStatusMessage('Payment is still being processed. Please wait...');

        } else if (data.status === "failed" || data.status === "amountmismatch") {
          stopPolling();
          setPaymentData(data);
          setError(data.errorMessage || "Payment verification failed");
          setStatusMessage('Payment failed');
          cleanupLocalStorage();

        } else if (data.status === "expired") {
          stopPolling();
          setPaymentData(data);
          setError("Payment session expired. Please try again.");
          setStatusMessage('Payment expired');
          cleanupLocalStorage();

        } else {
          stopPolling();
          setPaymentData(data);
          setError("Unknown payment status");
          setStatusMessage('Payment verification failed');
        }

      } catch (err) {
        console.error("Commitment payment verification error:", err);
        setStatusMessage('Retrying payment verification...');
      }
    };

    // Poll immediately, then every 5 seconds
    checkPaymentStatus();
    intervalRef.current = setInterval(checkPaymentStatus, 5000);

    return () => stopPolling();
  }, [txRef]);

  const cleanupLocalStorage = () => {
    localStorage.removeItem("commitmentTxRef");
    localStorage.removeItem("commitmentGigId");
    // Keep commitmentCaregiverName briefly for auto-message, clean on unmount
  };

  // Cleanup remaining localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("commitmentCaregiverName");
    };
  }, []);

  const handleGoToChat = () => {
    const caregiverId = paymentData?.caregiverId;
    const gigId = paymentData?.gigId || localStorage.getItem('commitmentGigId');
    const txReference = paymentData?.transactionReference || txRef;
    const unlockContext = buildUnlockContext(gigId, caregiverId, txReference);
    if (caregiverId) {
      navigate(`/app/client/message/${caregiverId}`, {
        state: { serviceId: gigId || undefined, unlockContext },
      });
    } else {
      navigate('/app/client/message');
    }
  };

  const handleRetry = () => {
    const gigId = paymentData?.gigId || localStorage.getItem('commitmentGigId');
    if (gigId) {
      navigate(`/app/client/cart/${gigId}`);
    } else {
      navigate('/app/client/dashboard');
    }
  };

  return (
    <div className="commitment-success-page">
      <div className="commitment-success-container">
        <div className="commitment-success-card">
          {paymentData?.status === "completed" ? (
            <>
              {/* Success */}
              <div className="commitment-status-icon commitment-status-icon--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="commitment-success-title commitment-success-title--success">
                Chat Access Unlocked!
              </h1>

              <p className="commitment-success-subtitle">
                You can now message this caregiver to discuss your care needs.
                When you hire this caregiver, the ₦5,000 fee will be deducted from your order total.
                Please note: this fee is non-refundable if you choose not to hire.
              </p>

              {/* Payment details */}
              <div className="commitment-details">
                <div className="commitment-detail-row">
                  <span>Amount Paid</span>
                  <span>₦{paymentData.amount?.toLocaleString()}</span>
                </div>
                {paymentData.flutterwaveFees > 0 && (
                  <div className="commitment-detail-row">
                    <span>Payment Fees</span>
                    <span>₦{paymentData.flutterwaveFees?.toLocaleString()}</span>
                  </div>
                )}
                <div className="commitment-detail-row">
                  <span>Total Charged</span>
                  <span>₦{paymentData.totalCharged?.toLocaleString()}</span>
                </div>
                <div className="commitment-detail-row">
                  <span>Reference</span>
                  <span className="commitment-detail-ref">{paymentData.transactionReference}</span>
                </div>
                {paymentData.completedAt && (
                  <div className="commitment-detail-row">
                    <span>Date</span>
                    <span>{new Date(paymentData.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="commitment-actions">
                <button className="commitment-btn commitment-btn--primary" onClick={handleGoToChat}>
                  💬 Go to Chat
                </button>
                <button
                  className="commitment-btn commitment-btn--secondary"
                  onClick={handleDownloadReceipt}
                  disabled={receiptDownloading}
                >
                  {receiptDownloading ? 'Downloading…' : '⬇ Download Receipt'}
                </button>
                <button className="commitment-btn commitment-btn--secondary" onClick={() => navigate('/app/client/dashboard')}>
                  Browse More Services
                </button>
              </div>
            </>
          ) : paymentData?.status === "pending" || (!paymentData && !error) ? (
            <>
              {/* Pending / Loading */}
              <div className="commitment-status-icon commitment-status-icon--pending">
                <div className="commitment-spinner" />
              </div>
              <h1 className="commitment-success-title commitment-success-title--pending">
                Verifying Payment
              </h1>
              <p className="commitment-success-subtitle">
                {statusMessage}
              </p>
              <p className="commitment-success-hint">
                {status !== 'cancelled'
                  ? 'Complete your payment in the Flutterwave tab, then wait here — we\'ll confirm it automatically.'
                  : 'Please wait while we confirm your ₦5,000 commitment payment...'}
              </p>
            </>
          ) : (
            <>
              {/* Failed / Error */}
              <div className="commitment-status-icon commitment-status-icon--failed">
                ✕
              </div>
              <h1 className="commitment-success-title commitment-success-title--failed">
                Payment Failed
              </h1>
              <p className="commitment-success-subtitle">
                {error || "Something went wrong with your commitment payment."}
              </p>
              {txRef && (
                <p className="commitment-success-ref">Reference: {txRef}</p>
              )}
              <div className="commitment-actions">
                <button className="commitment-btn commitment-btn--primary" onClick={handleRetry}>
                  Try Again
                </button>
                <button className="commitment-btn commitment-btn--secondary" onClick={() => navigate('/app/client/dashboard')}>
                  Browse Services
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitmentSuccess;
