import React from "react";
import { useNavigate } from "react-router-dom";
import "./serviceCard.css";

const ServiceCard = ({ id, image1, title, location, packageDetails, rating, isPremium }) => {
  const navigate = useNavigate();
  const basePath = "/app/client";

  const handleClick = () => {
    navigate(`${basePath}/service/${id}`);
  };

  // Format rating to ensure it has one decimal place
  const formattedRating = rating ? parseFloat(rating).toFixed(1) : "N/A";
  
  // Handle missing image with a fallback
  const imgSrc = image1 || "https://via.placeholder.com/800x600?text=CarePro+Premium+Service";

  // Format location with emoji if not present in text
  const displayLocation = location ? 
    (location.includes("📍") ? location : location) : 
    "Available Nationwide";

  // Shortened package details for card display
  const shortDescription = packageDetails || "Premium care service tailored to your needs";
  
  return (
    <div className="service-card" onClick={handleClick}>
      <div className="service-img-container">
        <img src={imgSrc} alt={title} className="service-img" />
        {isPremium && <div className="premium-badge">Premium</div>}
      </div>
      <div className="service-content">
        <div className="location">{displayLocation}</div>
        <h3 className="service-title">{title}</h3>
        <p>{shortDescription}</p>
        <div className="card-footer">
          <div className="rating">
            {formattedRating !== "N/A" ? (
              <>⭐ {formattedRating}</>
            ) : (
              <span className="new-service">New</span>
            )}
          </div>
          <div className="view-details">Details →</div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;