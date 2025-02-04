import React from "react";
import "./serviceCard.css";

const ServiceCard = ({ image, name, location, description, rating }) => (
  <div className="service-card">
    <img src={image} alt={name} className="service-img" />
    <div className="service-content">
      <div className="location">{location}</div>
      <h3>{name}</h3>
      <p>{description}</p>
      <div className="rating">⭐ {rating}</div>
    </div>
  </div>
);

export default ServiceCard;
