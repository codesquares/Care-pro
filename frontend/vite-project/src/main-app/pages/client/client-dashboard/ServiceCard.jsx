import React from "react";
import "./serviceCard.css";

const ServiceCard = ({ image1, title, location, packageDetails, rating }) => (
  <div className="service-card">
    <img src={image1} alt={name} className="service-img" />
    <div className="service-content">
      <div className="location">{location}</div>
      <h3 className="service-title">{title}</h3>
      <p>{packageDetails}</p>
      <div className="rating">⭐ {rating}</div>
    </div>
  </div>
);

export default ServiceCard;
