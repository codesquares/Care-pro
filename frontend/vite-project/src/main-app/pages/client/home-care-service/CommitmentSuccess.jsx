import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import bookingCommitmentService from '../../../services/bookingCommitmentService';
import paymentReceiptService from '../../../services/paymentReceiptService';
import { toast } from 'react-toastify';
import './CommitmentSuccess.css';

const normalizePaymentStatus = (statusValue) => String(statusValue || '').trim().toLowerCase();
const isSuccessfulPaymentStatus = (statusValue) => {
  const normalized = normalizePaymentStatus(statusValue);
  return normalized === 'completed' || normalized === 'successful' || normalized === 'succeeded' || normalized === 'success';
};

const CommitmentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
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

        if (data.success && isSuccessfulPaymentStatus(data.status)) {
          stopPolling();
          setPaymentData(data);
          setStatusMessage('Payment verified.');
          cleanupLocalStorage();

        } else if (normalizePaymentStatus(data.status) === "pending") {
          setStatusMessage('Payment is still being processed. Please wait...');

        } else if (normalizePaymentStatus(data.status) === "failed" || normalizePaymentStatus(data.status) === "amountmismatch") {
          stopPolling();
          setPaymentData(data);
          setError(data.errorMessage || "Payment verification failed");
          setStatusMessage('Payment failed');
          cleanupLocalStorage();

        } else if (normalizePaymentStatus(data.status) === "expired") {
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
          {isSuccessfulPaymentStatus(paymentData?.status) ? (
            <>
              {/* Success */}
              <div className="commitment-status-icon commitment-status-icon--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="commitment-success-title commitment-success-title--success">
                Payment Confirmed
              </h1>

              <p className="commitment-success-subtitle">
                Your ₦5,000 payment has been received. Please note that chat is no longer
                unlocked by a fee — you can message your caregiver once they accept your care
                package request. If you have questions about this payment, please contact
                CarePro support.
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
                <button
                  className="commitment-btn commitment-btn--primary"
                  onClick={handleDownloadReceipt}
                  disabled={receiptDownloading}
                >
                  {receiptDownloading ? 'Downloading…' : '⬇ Download Receipt'}
                </button>
                <button className="commitment-btn commitment-btn--secondary" onClick={() => navigate('/app/client/requests')}>
                  View My Requests
                </button>
              </div>
            </>
          ) : normalizePaymentStatus(paymentData?.status) === "pending" || (!paymentData && !error) ? (
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
