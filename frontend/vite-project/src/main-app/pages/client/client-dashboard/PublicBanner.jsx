import React from "react";
import { useNavigate } from 'react-router-dom';
import "./banner.css";

const PublicBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="banner-top public-banner">
      <div className="welcome-section">
        <div className="public-hero-content">
          {/* <h1 className="public-hero-title">Find Quality Care Services</h1> */}
          {/* <p className="public-hero-subtitle">
            Browse trusted caregivers and home care services in your area. 
            Quality care, verified professionals, all in one place.
          </p> */}
        </div>
      </div>

      <div className="public-features">
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Verified Caregivers</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Quality Service</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          <span className="feature-text">Trusted by Families</span>
        </div>
      </div>

      <div className="public-cta-banner">
        <div className="cta-content">
          <h3>Ready to get started?</h3>
          <p>Join thousands of families finding quality care</p>
        </div>
        <div className="cta-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicBanner;
