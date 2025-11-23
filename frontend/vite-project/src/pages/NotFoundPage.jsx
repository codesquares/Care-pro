import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/pages/not-found.scss';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found | CarePro</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to CarePro's homepage to find what you need." />
      </Helmet>
      
      <div className="not-found-page">
        <div className="not-found-content">
          <div className="text-section">
            <h1 className="error-heading">404! Oops!</h1>
            <p className="error-message">
              Sorry, but the page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className="action-buttons">
              <Link to="/" className="btn primary-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Home
              </Link>
              <Link to="/login" className="btn secondary-btn">Sign In</Link>
            </div>
          </div>
          
          <div className="illustration-section">
            <div className="search-icon">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="75" cy="75" r="45" stroke="#5DCED8" strokeWidth="8" fill="none"/>
                <line x1="108" y1="108" x2="160" y2="160" stroke="#5DCED8" strokeWidth="8" strokeLinecap="round"/>
                <circle cx="75" cy="75" r="30" fill="#5DCED8" fillOpacity="0.2"/>
              </svg>
            </div>
            
            <div className="lost-illustration">
              <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Person looking lost */}
                <ellipse cx="150" cy="80" rx="30" ry="35" fill="#2C3E50"/>
                <circle cx="140" cy="75" rx="3" ry="3" fill="#FFFFFF"/>
                <circle cx="160" cy="75" rx="3" ry="3" fill="#FFFFFF"/>
                <path d="M140 90 Q150 95 160 90" stroke="#FFFFFF" strokeWidth="2" fill="none"/>
                
                {/* Body */}
                <rect x="120" y="110" width="60" height="100" rx="10" fill="#5DCED8"/>
                <rect x="100" y="150" width="30" height="80" rx="8" fill="#5DCED8"/>
                <rect x="170" y="150" width="30" height="80" rx="8" fill="#5DCED8"/>
                
                {/* Legs */}
                <rect x="120" y="210" width="25" height="90" rx="8" fill="#5DCED8"/>
                <rect x="155" y="210" width="25" height="90" rx="8" fill="#5DCED8"/>
                <circle cx="132" cy="300" r="12" fill="#2C3E50"/>
                <circle cx="167" cy="300" r="12" fill="#2C3E50"/>
                
                {/* Question marks floating around */}
                <text x="80" y="150" fill="#FF6B6B" fontSize="36" fontWeight="bold">?</text>
                <text x="210" y="130" fill="#FF6B6B" fontSize="36" fontWeight="bold">?</text>
                <text x="60" y="250" fill="#FF6B6B" fontSize="30" fontWeight="bold">?</text>
                <text x="220" y="240" fill="#FF6B6B" fontSize="30" fontWeight="bold">?</text>
                
                {/* Map/paper in hand */}
                <rect x="85" y="165" width="25" height="35" rx="2" fill="#FFFFFF" stroke="#2C3E50" strokeWidth="2"/>
                <line x1="90" y1="175" x2="105" y2="175" stroke="#2C3E50" strokeWidth="1"/>
                <line x1="90" y1="185" x2="105" y2="185" stroke="#2C3E50" strokeWidth="1"/>
                <line x1="90" y1="190" x2="100" y2="190" stroke="#2C3E50" strokeWidth="1"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;