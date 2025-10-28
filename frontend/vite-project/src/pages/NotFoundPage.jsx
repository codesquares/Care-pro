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
        <div className="not-found-container">
          <div className="not-found-content">
            <div className="error-code">404</div>
            <h1>Page Not Found</h1>
            <p className="error-message">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
            <div className="action-buttons">
              <Link to="/" className="home-button">
                Go Back Home
              </Link>
              <Link to="/login" className="login-button">
                Sign In
              </Link>
            </div>
          </div>
          <div className="illustration">
            <div className="illustration-content">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" stroke="#e0e7ff" strokeWidth="2" fill="#f8fafc"/>
                <path d="M70 70 L130 130 M130 70 L70 130" stroke="#64748b" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="100" cy="100" r="50" stroke="#3b82f6" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;