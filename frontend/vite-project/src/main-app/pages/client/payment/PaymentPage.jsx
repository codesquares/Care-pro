import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./payment.css";

const PaymentPage = () => {
  const location = useLocation();
  const { service, totalAmount, orderNumber } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("card");
  
  return (
    <div className="payment-container">
      {/* Left Section: Payment Form */}
      <div className="payment-form">
        <h2>Hi John,</h2>
        <p>Pay <strong>₦{totalAmount}</strong></p>

        {/* Payment Methods */}
        <div className="payment-methods">
          <label>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="card" 
              checked={paymentMethod === "card"} 
              onChange={() => setPaymentMethod("card")} 
            />
            Card
          </label>
          <label>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="bank" 
              onChange={() => setPaymentMethod("bank")} 
            />
            Bank
          </label>
          <label>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="transfer" 
              onChange={() => setPaymentMethod("transfer")} 
            />
            Transfer
          </label>
        </div>

        {/* Card Payment Fields */}
        {paymentMethod === "card" && (
          <>
            <label>Card Number</label>
            <input type="text" placeholder="1234 5678 9101 1121" />

            <div className="card-details">
              <div>
                <label>Expiration Date</label>
                <input type="text" placeholder="MM/YY" />
              </div>
              <div>
                <label>CVV</label>
                <input type="text" placeholder="123" />
              </div>
            </div>

            <label className="save-card">
              <input type="checkbox" /> Save card details
            </label>
          </>
        )}

        {/* Pay Button */}
        <button className="pay-button">Pay ₦{totalAmount}</button>
        <p className="privacy-note">
          Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
        </p>
      </div>

      {/* Right Section: Order Summary */}
      <div className="order-summary">
        <h3>Order Details</h3>
        <img src={service?.image1 || "/placeholder.jpg"} alt="Service" className="order-image" />
        <p className="order-description">{service?.title || "Service description..."}</p>
        <span className="order-status">🟡 In Progress</span>

        <p><strong>Ordered from:</strong> {service?.providerName}</p>
        <p><strong>Order fee:</strong> ₦{service?.price}</p>
        <p><strong>Service fee:</strong> ₦{totalAmount - service?.price}</p>
        <p><strong>Total amount:</strong> ₦{totalAmount}</p>
        <p><strong>Order number:</strong> <span className="order-number">{orderNumber}</span></p>
      </div>
    </div>
  );
};

export default PaymentPage;
