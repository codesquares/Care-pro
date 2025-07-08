import React from 'react';
import { Link } from 'react-router-dom';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="logo-container">
          <h1 className="app-logo">CarePro</h1>
          <p className="tagline">Professional Care at Your Fingertips</p>
        </div>
        
        <div className="splash-message">
          <h2>Welcome to CarePro</h2>
          <p>Your trusted platform for connecting with qualified caregivers</p>
        </div>
        
        <div className="button-container">
          <Link to="/login" className="splash-button login-button">
            <span className="button-text">Login</span>
            <span className="button-icon">→</span>
          </Link>
          
          <Link to="/register" className="splash-button register-button">
            <span className="button-text">Register</span>
            <span className="button-icon">+</span>
          </Link>
        </div>
        
        <div className="splash-footer">
          <p>Experience the future of caregiving</p>
        </div>
      </div>
      
      <div className="background-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
