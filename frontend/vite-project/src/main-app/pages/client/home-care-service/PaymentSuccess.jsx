import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import configs from '../../../config';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCreated = useRef(false); // Prevent duplicate requests
  const [orderStatus, setOrderStatus] = useState('Processing...');

  const status = searchParams.get("status");
  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");
  const errorMessage = searchParams.get("message") || searchParams.get("error");

  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const gigId = localStorage.getItem("gigId");
  const amount = parseFloat(localStorage.getItem("amount") || "0");
  
  // Get order data from localStorage
  const orderData = JSON.parse(localStorage.getItem("orderData") || "null");

  useEffect(() => {
    const createOrderAndSendTasks = async () => {
      if (status === "successful" && transactionId && user?.id && gigId && !orderCreated.current) {
        orderCreated.current = true; // Mark as processed
        console.log("Payment Successful!", { transactionId, txRef });
        console.log("Order data:", orderData);

        try {
          setOrderStatus('Creating order...');
          
          // Step 1: Create the order
          const orderPayload = {
            clientId: user.id,
            gigId: gigId,
            paymentOption: "Online Payment",
            amount: amount, // This is now the total amount (order fee + service fee)
            transactionId: transactionId,
          };

          const orderResponse = await fetch(
            "https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(orderPayload),
            }
          );

          if (!orderResponse.ok) {
            throw new Error("Order creation failed");
          }

          const orderResult = await orderResponse.json();
          console.log("Order Created Successfully:", orderResult);
          
          // Step 2: Send tasks if available
          if (orderData && orderData.tasks && orderData.tasks.length > 0) {
            setOrderStatus('Saving your tasks...');
            
            await sendTasksToBackend(orderData.tasks, user.id);
          }
          
          // Step 3: Send frequency and pricing data if available
          if (orderData && orderData.priceData) {
            setOrderStatus('Saving service preferences...');
            
            await sendServicePreferences(orderData, user.id);
          }
          
          setOrderStatus('Order completed successfully!');
          
          // Clean up localStorage
          localStorage.removeItem("orderData");
          localStorage.removeItem("gigId");
          localStorage.removeItem("amount");

          setTimeout(() => {
            navigate("/app/client/my-orders");
          }, 2000);
          
        } catch (error) {
          console.error("Order processing error:", error);
          setOrderStatus('Order created, but some preferences may not have been saved.');
          
          setTimeout(() => {
            navigate("/app/client/my-orders");
          }, 3000);
        }
      } else if (status !== "successful") {
        // Handle payment failure - clean up localStorage and provide feedback
        console.log("Payment failed or cancelled:", { status, errorMessage, txRef });
        
        // Clean up any stored payment data
        localStorage.removeItem("orderData");
        localStorage.removeItem("gigId");
        localStorage.removeItem("amount");
        localStorage.removeItem("providerId");
      }
    };

    createOrderAndSendTasks();
  }, [status, transactionId, user, gigId, navigate, orderData, errorMessage]);

  // Function to get user-friendly error message
  const getErrorMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }
    
    switch (status) {
      case "failed":
        return "Your payment could not be processed. This might be due to insufficient funds, declined card, or network issues.";
      case "cancelled":
        return "You cancelled the payment process.";
      case "timeout":
        return "The payment session timed out. Please try again.";
      default:
        return "Something went wrong with your payment. Please check your payment details and try again.";
    }
  };

  // Function to handle retry payment
  const handleRetryPayment = () => {
    // Redirect back to cart with the same gig ID
    if (gigId) {
      navigate(`/app/client/cart/${gigId}`);
    } else {
      // Fallback to dashboard if no gig ID
      navigate("/app/client/dashboard");
    }
  };

  // Function to send tasks to backend
  const sendTasksToBackend = async (tasks, clientId) => {
    try {
      const endpoint = configs.BASE_URL;
      const response = await fetch(`${endpoint}/ClientPreferences/clientId?${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ tasks })
      });

      if (!response.ok) {
        throw new Error('Failed to send tasks');
      }

      const data = await response.json();
      console.log('Tasks sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending tasks:', error);
      throw error;
    }
  };

  // Function to send service preferences (frequency, pricing, etc.)
  const sendServicePreferences = async (orderData, clientId) => {
    try {
      const preferences = {
        clientId,
        serviceId: orderData.serviceId,
        selectedFrequency: orderData.selectedFrequency,
        priceData: orderData.priceData,
        timestamp: orderData.timestamp
      };

      // You might want to create a different endpoint for service preferences
      // For now, I'll log it - you can implement the actual API call
      console.log('Service preferences to save:', preferences);
      
      // Uncomment and modify when you have the endpoint
      /*
      const endpoint = configs.BASE_URL;
      const response = await fetch(`${endpoint}/ServicePreferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save service preferences');
      }

      const data = await response.json();
      console.log('Service preferences saved successfully:', data);
      return data;
      */
      
    } catch (error) {
      console.error('Error saving service preferences:', error);
      throw error;
    }
  };

  return (
    <div className="container">
      <h1>Payment {status === "successful" ? "Successful" : "Failed"}</h1>
      {status === "successful" ? (
        <div>
          <p>Transaction ID: {transactionId}</p>
          <p>Reference: {txRef}</p>
          <p>Amount Paid: ₦{amount.toLocaleString()}</p>
          <p>Status: {orderStatus}</p>
          {orderData && orderData.tasks && orderData.tasks.length > 0 && (
            <p>✓ {orderData.tasks.length} task(s) will be saved</p>
          )}
          {orderData && orderData.selectedFrequency && (
            <p>✓ Service frequency: {orderData.selectedFrequency}</p>
          )}
          <button onClick={() => navigate("/app/client/my-order")}>Go to Order</button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#e74c3c', marginBottom: '15px' }}>
            <strong>Payment Failed</strong>
          </p>
          <p style={{ marginBottom: '15px' }}>
            {getErrorMessage()}
          </p>
          {txRef && (
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Reference: {txRef}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleRetryPayment}
              style={{ 
                backgroundColor: '#3498db', 
                color: 'white', 
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate("/app/client/dashboard")}
              style={{ 
                backgroundColor: '#95a5a6', 
                color: 'white', 
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Browse Services
            </button>
            <button 
              onClick={() => navigate("/app/client/dashboard")}
              style={{ 
                backgroundColor: '#7f8c8d', 
                color: 'white', 
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
