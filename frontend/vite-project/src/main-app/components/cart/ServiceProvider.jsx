import React from 'react';
import './ServiceProvider.css';

const ServiceProvider = () => {
  return (
    <div className="service-provider">
      <div className="service-provider__avatar">
        <img 
          src="/api/placeholder/40/40" 
          alt="Ahmed Rufai" 
          className="service-provider__image"
        />
      </div>
      
      <div className="service-provider__info">
        <div className="service-provider__name-row">
          <span className="service-provider__name">Ahmed Rufai</span>
          <span className="service-provider__status"></span>
        </div>
        
        <div className="service-provider__badges">
          <span className="service-provider__badge service-provider__badge--available">
            Available
          </span>
          <span className="service-provider__badge service-provider__badge--verified">
            Yahoo Ladies
          </span>
          <div className="service-provider__rating">
            <span className="service-provider__star">★</span>
            <span className="service-provider__rating-text">4.5 (200)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProvider;