import React from "react";
import { useNavigate } from "react-router-dom"; // Import navigation hook
import "./serviceCard.css";

const ServiceCard = ({ id, image1, title, location, packageDetails, rating,}) => {
  const navigate = useNavigate();
  const basePath = "/app/client"; // Base path for your routes

  const handleClick = () => {
    navigate(`${basePath}/service/${id}`); // Navigate to service details page
  };

  return (
    <div className="service-card" onClick={handleClick} style={{ cursor: "pointer" }}>
      <img src={image1} alt={title} className="service-img" />
      <div className="service-content">
        <div className="location">{location}</div>
        <h3 className="service-title">{title}</h3>
        <p>{packageDetails}</p>
        <div className="rating">⭐ {rating}</div>
      </div>
    </div>
  );
};

export default ServiceCard;