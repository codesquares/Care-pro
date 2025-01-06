import React from "react";
import "./OrderCard.css";


const OrderCard = ({ title, user, price, status, image }) => {
  return (
    <div className="order-card">
      <img src={image} alt={title} className="order-image" />
      <div className="order-details">
        <h4>{title}</h4>
        <p>{user}</p>
        <div className="order-footer">
          <span className={`status ${status.toLowerCase()}`}>{status}</span>
          <span className="price">{price}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
