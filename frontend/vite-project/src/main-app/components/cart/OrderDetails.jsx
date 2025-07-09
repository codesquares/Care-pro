import React from 'react';
import './OrderDetails.css';
import {useState, useEffect } from 'react';

const OrderDetails = ({ service }) => {
  // // Extract service details
  console.log("Service details in OrderDetails:", service);
      const { title, caregiverName, rating, packageDetails, image1, plan, price, features, videoURL } = service;
      const serviceFee = price ? (price * 0.05).toFixed(2) : "₦3,270"; // Assuming service fee is 5% of price
      const generateOrderNumber = () => {
        return `#${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      };
      // generate order number once and dont generate it again
      const orderNumber = generateOrderNumber();
  const [orderData, setOrderData] = useState({
    serviceName: title || "I will clean your house and do your laundry twice a week",
    status: "In Progress",
    orderedFrom: caregiverName,
    orderFee: price,
    serviceFee: serviceFee,
    totalAmount: (price + Number(serviceFee)).toFixed(2),
    orderNumber: "#F02C6F335B05"
  });
 
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
              src={image1} 
              alt="Provider" 
              className="order-details__provider-image"
            />
            <span className="order-details__provider-name">
              {orderData.orderedFrom}
            </span>
          </div>
        </div>

        <div className="order-details__row">
          <span className="order-details__label">Order fee:</span>
          <span className="order-details__value">{orderData.orderFee}</span>
        </div>

        <div className="order-details__row">
          <span className="order-details__label">Service fee:</span>
          <span className="order-details__value">{orderData.serviceFee}</span>
        </div>

        <div className="order-details__row order-details__row--total">
          <span className="order-details__label">Total amount:</span>
          <span className="order-details__value order-details__value--total">
            {orderData.totalAmount}
          </span>
        </div>

        <div className="order-details__row">
          <span className="order-details__label">Order number:</span>
          <span className="order-details__value">{orderNumber}</span>
        </div>
      </div>

      <button className="order-details__payment-btn">
        Proceed to payment →
      </button>
    </div>
  );
};

export default OrderDetails;