import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import configs from '../../../config';
import SubscriptionService from '../../../services/subscriptionService';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusChecked = useRef(false);
  const [orderStatus, setOrderStatus] = useState('Verifying payment...');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  // Get transaction reference from URL or localStorage
  const txRef = searchParams.get("tx_ref") || localStorage.getItem("transactionReference");
  const status = searchParams.get("status");
  const transactionId = searchParams.get("transaction_id");
  const errorMessage = searchParams.get("message") || searchParams.get("error");

  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

  useEffect(() => {
    const verifyPaymentAndCreateOrder = async () => {
      if (statusChecked.current || !txRef) {
        if (!txRef) {
          setError("No transaction reference found");
          setOrderStatus('Payment verification failed');
        }
        return;
      }
      
      statusChecked.current = true;

      try {
        setOrderStatus('Verifying payment with server...');
        
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${configs.BASE_URL}/payments/status/${txRef}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to verify payment status");
        }

        const data = await response.json();
        console.log("Payment Status Response:", data);
        setPaymentData(data);

        if (data.success && data.status === "completed") {
          setOrderStatus('Payment verified! Order created successfully.');
          
          // Save any pending tasks if available
          const pendingTaskData = localStorage.getItem("pendingTaskData");
          if (pendingTaskData && data.clientOrderId) {
            try {
              await savePendingTasks(JSON.parse(pendingTaskData), data.clientOrderId);
            } catch (taskError) {
              console.error("Failed to save tasks:", taskError);
            }
          }
          
          // Clean up localStorage
          cleanupLocalStorage();
          
          // Check if a subscription was created for this order
          if (data.clientOrderId) {
            try {
              const subResult = await SubscriptionService.getSubscriptionByOrderId(data.clientOrderId);
              if (subResult.success && subResult.data) {
                setSubscriptionInfo(subResult.data);
              }
            } catch (subErr) {
              console.log('No subscription for this order (one-time payment)');
            }
          }
          
          // User will manually click "View My Orders" button to navigate
          
        } else if (data.status === "pending") {
          setOrderStatus('Payment is still being processed. Please wait...');
          
          // Retry status check after a delay
          setTimeout(() => {
            statusChecked.current = false;
          }, 5000);
          
        } else if (data.status === "failed" || data.status === "amountmismatch") {
          setError(data.errorMessage || "Payment verification failed");
          setOrderStatus('Payment failed');
          cleanupLocalStorage();
          
        } else {
          setError("Unknown payment status");
          setOrderStatus('Payment verification failed');
        }
        
      } catch (error) {
        console.error("Payment verification error:", error);
        setError(error.message);
        setOrderStatus('Error verifying payment');
      }
    };

    verifyPaymentAndCreateOrder();
  }, [txRef, navigate]);

  // Function to save pending tasks
  const savePendingTasks = async (taskData, orderId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${configs.BASE_URL}/ClientPreferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clientId: user.id,
        orderId: orderId,
        tasks: taskData.tasks
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save tasks');
    }
    
    return response.json();
  };

  // Clean up localStorage
  const cleanupLocalStorage = () => {
    localStorage.removeItem("transactionReference");
    localStorage.removeItem("paymentBreakdown");
    localStorage.removeItem("pendingTaskData");
  };

  // Function to handle retry payment
  const handleRetryPayment = () => {
    const pendingTaskData = localStorage.getItem("pendingTaskData");
    if (pendingTaskData) {
      const taskData = JSON.parse(pendingTaskData);
      if (taskData.gigId) {
        navigate(`/app/client/cart/${taskData.gigId}`);
        return;
      }
    }
    navigate("/app/client/dashboard");
  };

  // Render price breakdown
  const renderBreakdown = () => {
    if (!paymentData?.breakdown) return null;
    
    const { breakdown } = paymentData;
    return (
      <div className="payment-breakdown">
        <h3>Payment Breakdown</h3>
        <div className="breakdown-row">
          <span>Base Price:</span>
          <span>₦{breakdown.basePrice?.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span>Service Type:</span>
          <span>{breakdown.serviceType}</span>
        </div>
        {breakdown.frequencyPerWeek > 1 && (
          <div className="breakdown-row">
            <span>Frequency:</span>
            <span>{breakdown.frequencyPerWeek}x per week</span>
          </div>
        )}
        <div className="breakdown-row">
          <span>Order Fee:</span>
          <span>₦{breakdown.orderFee?.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span>Service Charge (10%):</span>
          <span>₦{breakdown.serviceCharge?.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span>Payment Fees:</span>
          <span>₦{breakdown.flutterwaveFees?.toLocaleString()}</span>
        </div>
        <div className="breakdown-row breakdown-total">
          <span>Total Paid:</span>
          <span>₦{breakdown.totalAmount?.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="payment-success-page">
      <div className="payment-success-container">
        <div className="payment-success-card">
          {paymentData?.status === "completed" ? (
            <>
              {/* Success Header */}
              <div className="payment-status-icon payment-status-icon--success">
                ✓
              </div>
              <h1 className="payment-success-title payment-success-title--success">
                Payment Successful!
              </h1>
              
              {/* Order Status */}
              <div className="payment-status-message payment-status-message--success">
                {orderStatus}
              </div>
              
              {/* Payment Breakdown */}
              {renderBreakdown()}
              
              {/* Payment Details */}
              <div className="payment-details">
                <div className="payment-detail-item">
                  <span className="payment-detail-label">Transaction Reference</span>
                  <span className="payment-detail-value">{paymentData?.transactionReference}</span>
                </div>
                {paymentData?.flutterwaveTransactionId && (
                  <div className="payment-detail-item">
                    <span className="payment-detail-label">Flutterwave ID</span>
                    <span className="payment-detail-value">{paymentData.flutterwaveTransactionId}</span>
                  </div>
                )}
                <div className="payment-detail-item">
                  <span className="payment-detail-label">Payment Date</span>
                  <span className="payment-detail-value">
                    {paymentData?.paymentDate ? new Date(paymentData.paymentDate).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="payment-actions">
                <button 
                  className="payment-btn payment-btn--primary"
                  onClick={() => navigate("/app/client/my-order")}
                >
                  View My Orders
                </button>
                {subscriptionInfo && (
                  <button
                    className="payment-btn payment-btn--secondary"
                    onClick={() => navigate(`/app/client/subscriptions/${subscriptionInfo.id}`)}
                  >
                    View Subscription
                  </button>
                )}
              </div>

              {/* Subscription Info */}
              {subscriptionInfo && (
                <div className="payment-subscription-info">
                  <h3>Subscription Created</h3>
                  <div className="payment-detail-item">
                    <span className="payment-detail-label">Billing Cycle</span>
                    <span className="payment-detail-value">{subscriptionInfo.billingCycle}</span>
                  </div>
                  <div className="payment-detail-item">
                    <span className="payment-detail-label">Next Charge</span>
                    <span className="payment-detail-value">
                      {subscriptionInfo.nextChargeDate
                        ? new Date(subscriptionInfo.nextChargeDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="payment-detail-item">
                    <span className="payment-detail-label">Payment Method</span>
                    <span className="payment-detail-value">
                      {SubscriptionService.formatCardDisplay(subscriptionInfo.cardBrand, subscriptionInfo.cardLastFour)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : paymentData?.status === "pending" ? (
            <>
              {/* Pending Header */}
              <div className="payment-status-icon payment-status-icon--pending">
                ⏳
              </div>
              <h1 className="payment-success-title payment-success-title--pending">
                Payment Processing
              </h1>
              
              <div className="payment-status-message payment-status-message--processing">
                <div className="loading-spinner" style={{ margin: '0 auto 10px auto' }}></div>
                {orderStatus}
              </div>
              
              <p>Please wait while we confirm your payment...</p>
            </>
          ) : error || paymentData?.status === "failed" ? (
            <>
              {/* Failed Header */}
              <div className="payment-status-icon payment-status-icon--failed">
                ✕
              </div>
              <h1 className="payment-success-title payment-success-title--failed">
                Payment Failed
              </h1>
              
              {/* Error Message */}
              <div className="error-message">
                <div className="error-title">Payment could not be processed</div>
                <div>{error || paymentData?.errorMessage || "Something went wrong with your payment."}</div>
                {txRef && (
                  <div className="error-reference">Reference: {txRef}</div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="payment-actions">
                <button 
                  className="payment-btn payment-btn--primary"
                  onClick={handleRetryPayment}
                >
                  Try Again
                </button>
                <button 
                  className="payment-btn payment-btn--secondary"
                  onClick={() => navigate("/app/client/dashboard")}
                >
                  Browse Services
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Loading State */}
              <div className="payment-status-message payment-status-message--processing">
                <div className="loading-spinner" style={{ margin: '0 auto 10px auto' }}></div>
                {orderStatus}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
