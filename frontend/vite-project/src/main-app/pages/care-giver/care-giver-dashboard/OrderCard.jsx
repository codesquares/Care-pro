import React from "react";
import "./OrderCard.css";


const OrderCard = ({ title, user, price, status, image }) => {
  return (
    <div className="order-card">
    <img src={image} alt={title} className="order-image" />
    <div className="order-details">
      <div className="order-main">
        <h4 className="order-title">{title}</h4>
        <p className="order-author">{user}</p>
        <span className={`status ${status.toLowerCase()}`}>{status}</span>
      </div>
      <div className="order-price">{price}</div>
    </div>
  </div>
  );
};

export default OrderCard;
