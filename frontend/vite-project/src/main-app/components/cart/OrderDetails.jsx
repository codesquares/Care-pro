import React from 'react';
import './OrderDetails.css';
import {useState, useEffect } from 'react';
import { PriceCalculator } from './ServiceFrequency';

const OrderDetails = ({ service, selectedFrequency, priceData, onPayment }) => {
  // Extract service details
  console.log("Service details in OrderDetails:", service);
  console.log("Selected frequency in OrderDetails:", selectedFrequency);
  console.log("Price data in OrderDetails:", priceData);
  
  const { title, caregiverName, rating, packageDetails, image1, plan, price, features, videoURL, caregiverProfileImage } = service;

  console.log("where is service from?:", service);
  
  // Use price data if available, otherwise fallback to base price
  const effectivePrice = priceData ? priceData.calculatedPrice : price;
  const serviceFee = effectivePrice ? (effectivePrice * 0.05) : (price * 0.05);
  const totalAmount = effectivePrice + serviceFee;
  
  const generateOrderNumber = () => {
    return `#${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };
  
  // Generate order number once and don't generate it again
  const [orderNumber] = useState(() => generateOrderNumber());
  const [orderData, setOrderData] = useState({
    serviceName: title || "I will clean your house and do your laundry twice a week",
    status: "In Progress",
    orderedFrom: caregiverName,
    orderFee: effectivePrice,
    serviceFee: serviceFee,
    totalAmount: totalAmount,
    orderNumber: orderNumber
  });

  // Update order data when price data changes
  useEffect(() => {
    if (priceData) {
      const newServiceFee = priceData.calculatedPrice * 0.05;
      const newTotalAmount = priceData.calculatedPrice + newServiceFee;
      
      setOrderData(prev => ({
        ...prev,
        orderFee: priceData.calculatedPrice,
        serviceFee: newServiceFee,
        totalAmount: newTotalAmount
      }));
    }
  }, [priceData]);
 
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
            <span className="order-details__label">Service Frequency:</span>
            <span className="order-details__value">
              {PriceCalculator.getFrequencyDisplayName(selectedFrequency)}
            </span>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="order-details__row">
          <span className="order-details__label">Order fee:</span>
          <span className="order-details__value">
            {PriceCalculator.formatPrice(orderData.orderFee)}
          </span>
        </div>

        {/* Show savings if applicable */}
        {priceData && priceData.savings > 0 && (
          <div className="order-details__row order-details__row--savings">
            <span className="order-details__label">You save:</span>
            <span className="order-details__value order-details__value--savings">
              -{PriceCalculator.formatPrice(priceData.savings)}
            </span>
          </div>
        )}

        <div className="order-details__row">
          <span className="order-details__label">Service fee (5%):</span>
          <span className="order-details__value">
            {PriceCalculator.formatPrice(orderData.serviceFee)}
          </span>
        </div>

        <div className="order-details__row order-details__row--total">
          <span className="order-details__label">Total amount:</span>
          <span className="order-details__value order-details__value--total">
            {PriceCalculator.formatPrice(orderData.totalAmount)}
          </span>
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
        Proceed to payment → {PriceCalculator.formatPrice(orderData.totalAmount)}
      </button>
    </div>
  );
};

export default OrderDetails;