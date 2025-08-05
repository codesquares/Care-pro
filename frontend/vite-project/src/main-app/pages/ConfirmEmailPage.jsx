import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../../styles/main-app/pages/ConfirmEmailPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import { validateEmailToken, confirmEmail } from "../services/auth";

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get parameters from URL

  const token = searchParams.get('token');

  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Auto-confirm email when component mounts if we have the required parameters
  useEffect(() => {
    if (token && !confirmationAttempted) {
      handleEmailConfirmation();
    } else if (!token) {
      setError("Invalid confirmation link. Missing required parameters.");
    }
  }, [token, confirmationAttempted]);

  // Handle email confirmation
  const handleEmailConfirmation = async () => {
    if (confirmationAttempted) return;
    
    setConfirmationAttempted(true);
    setError(null);
    setLoading(true);

    try {
      // Step 1: Validate the token and get user information
      const tokenValidationResult = await validateEmailToken(token);
      
      // Check if token validation was successful
      if (!tokenValidationResult.success) {
        throw new Error('Invalid or expired confirmation token');
      }
      
      setUserInfo(tokenValidationResult);
      
      // Step 2: Use the userId from token validation to confirm email
      await confirmEmail(tokenValidationResult.userId);
      
      setSuccess(true);
      toast.success("Email confirmed successfully! You can now login to your account.");
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Email confirmation error:", err);
      const errorMessage = err.message || "Failed to confirm email. Please check your internet connection and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manual retry function
  const handleRetry = () => {
    setConfirmationAttempted(false);
    setError(null);
    setSuccess(false);
    handleEmailConfirmation();
  };

  return (
    <div className="confirm-email-page">
      <div className="confirm-email-container">
        <div className="form-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <h1>Confirming Your Email</h1>
              <p className="subtitle">
                Please wait while we verify your email address...
              </p>
            </div>
          ) : success ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h1>Email Confirmed!</h1>
              <p className="success-message">
                {userInfo?.email ? (
                  <>Your email address <strong>{userInfo.email}</strong> has been successfully verified.</>
                ) : (
                  "Your email address has been successfully verified."
                )}
              </p>
              <p className="subtitle">
                You can now login to your account with full access to all features.
                You will be redirected to the login page in a few seconds.
              </p>
              <button 
                className="btn primary" 
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">✗</div>
              <h1>Email Confirmation Failed</h1>
              <p className="error-message">{error}</p>
              <p className="subtitle">
                This could happen if the confirmation link has expired or has already been used.
                Please try registering again or contact support if the problem persists.
              </p>
              {token && (
                <button 
                  className="btn secondary" 
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              )}
              <div className="action-links">
                <Link to="/register" className="link">Register Again</Link>
                <span className="separator">•</span>
                <Link to="/login" className="link">Back to Login</Link>
              </div>
            </div>
          ) : (
            <div className="invalid-link-state">
              <div className="error-icon">⚠</div>
              <h1>Invalid Confirmation Link</h1>
              <p className="error-message">
                The confirmation link appears to be invalid or incomplete.
              </p>
              <p className="subtitle">
                Please check your email for the correct confirmation link, or register for a new account.
              </p>
              <div className="action-links">
                <Link to="/register" className="link">Register New Account</Link>
                <span className="separator">•</span>
                <Link to="/login" className="link">Back to Login</Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="image-container">
          <img src={authImage} alt="Email confirmation" />
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
