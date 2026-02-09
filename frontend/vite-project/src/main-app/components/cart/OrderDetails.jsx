
import './OrderDetails.css';
import {useState, useEffect } from 'react';

// Helper function to format price
const formatPrice = (amount) => {
  return `₦${(amount || 0).toLocaleString()}`;
};

// Helper function to get frequency display name
const getServiceTypeDisplayName = (serviceType, frequencyPerWeek) => {
  switch (serviceType) {
    case 'one-time':
      return 'One-Time Service';
    case 'weekly':
      return `Weekly (${frequencyPerWeek}x per week)`;
    case 'monthly':
      return `Monthly (${frequencyPerWeek}x per week × 4 weeks)`;
    default:
      return serviceType;
  }
};

const OrderDetails = ({ service, selectedFrequency, frequencyPerWeek = 1, onPayment }) => {
  // Extract service details
  const { title, caregiverName, rating, packageDetails, image1, plan, price, features, videoURL, caregiverProfileImage } = service;
  
  // Calculate estimated prices for display (backend calculates actual)
  const calculateEstimatedPrice = () => {
    const basePrice = price || 0;
    let orderFee;
    
    switch (selectedFrequency) {
      case 'one-time':
        orderFee = basePrice;
        break;
      case 'weekly':
        orderFee = basePrice * frequencyPerWeek;
        break;
      case 'monthly':
        orderFee = basePrice * frequencyPerWeek * 4;
        break;
      default:
        orderFee = basePrice;
    }
    
    const serviceFee = orderFee * 0.10; // 10% service charge
    const totalAmount = orderFee + serviceFee;
    
    return { orderFee, serviceFee, totalAmount };
  };
  
  const generateOrderNumber = () => {
    return `#${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };
  
  // Generate order number once
  const [orderNumber] = useState(() => generateOrderNumber());
  
  // Get estimated prices
  const estimatedPrices = calculateEstimatedPrice();
  
  const [orderData, setOrderData] = useState({
    serviceName: title || "Service",
    status: "In Progress",
    orderedFrom: caregiverName,
    orderFee: estimatedPrices.orderFee,
    serviceFee: estimatedPrices.serviceFee,
    totalAmount: estimatedPrices.totalAmount,
    orderNumber: orderNumber
  });

  // Update order data when frequency changes
  useEffect(() => {
    const newPrices = calculateEstimatedPrice();
    setOrderData(prev => ({
      ...prev,
      orderFee: newPrices.orderFee,
      serviceFee: newPrices.serviceFee,
      totalAmount: newPrices.totalAmount
    }));
  }, [selectedFrequency, frequencyPerWeek, price]);
 
  return (
    <div className="order-details">
      <h3 className="order-details__title">Order Details</h3>
      
      <div className="order-details__service">
        <div className="order-details__service-image">
          <img 
            src={image1} 
            alt="Service" 
            className="order-details__image"
          />
        </div>
        
        <div className="order-details__service-info">
          <div className="order-details__service-name">
            {orderData.serviceName}
          </div>
          <div className="order-details__status">
            <span className="order-details__status-badge">
              • {orderData.status}
            </span>
          </div>
        </div>
      </div>

      <div className="order-details__summary">
        <div className="order-details__row">
          <span className="order-details__label">Ordered from:</span>
          <div className="order-details__provider">
            <img 
              src={caregiverProfileImage} 
              alt="Provider" 
              className="order-details__provider-image"
            />
            <span className="order-details__provider-name">
              {orderData.orderedFrom}
            </span>
          </div>
        </div>

        {/* Service Frequency Information */}
        {selectedFrequency && (
          <div className="order-details__row">
            <span className="order-details__label">Service Type:</span>
            <span className="order-details__value">
              {getServiceTypeDisplayName(selectedFrequency, frequencyPerWeek)}
            </span>
          </div>
        )}

        {/* Price Breakdown (Estimated - final calculated by backend) */}
        <div className="order-details__row">
          <span className="order-details__label">Order fee (estimated):</span>
          <span className="order-details__value">
            {formatPrice(orderData.orderFee)}
          </span>
        </div>

        <div className="order-details__row">
          <span className="order-details__label">Service fee (10%):</span>
          <span className="order-details__value">
            {formatPrice(orderData.serviceFee)}
          </span>
        </div>

        <div className="order-details__row order-details__row--total">
          <span className="order-details__label">Estimated total:</span>
          <span className="order-details__value order-details__value--total">
            {formatPrice(orderData.totalAmount)}
          </span>
        </div>
        
        <div className="order-details__note">
          <small>* Final price including payment fees will be shown at checkout</small>
        </div>

        <div className="order-details__row">
          <span className="order-details__label">Order number:</span>
          <span className="order-details__value">{orderNumber}</span>
        </div>
      </div>

      <button 
        className="order-details__payment-btn"
        onClick={onPayment}
      >
        Proceed to payment → {formatPrice(orderData.totalAmount)}
      </button>
    </div>
  );
};

export default OrderDetails;