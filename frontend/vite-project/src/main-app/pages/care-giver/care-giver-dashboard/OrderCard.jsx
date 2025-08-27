import React from "react";
import "./OrderCard.css";

const OrderCard = ({ title, user, price, status, image, orderId, onClick }) => {
  const handleClick = () => {
    if (onClick && orderId) {
      onClick(orderId);
    }
  };

  return (
    <div className="order-card" onClick={handleClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="image-wrapper">
      <img src={image} alt={title} className="order-image" />
    </div>
    <div className="order-content">
      <div className="order-main">
        <h4 className="order-title">{title}</h4>
        <p className="order-user">👤{user}</p>
      </div>
      <div className="order-footer">
        <span className={`status ${status.toLowerCase()}`}>● {status}</span>
        <span className="order-price">Price: ₦{price}</span>
      </div>
    </div>
  </div>
  
  );
};

export default OrderCard;
