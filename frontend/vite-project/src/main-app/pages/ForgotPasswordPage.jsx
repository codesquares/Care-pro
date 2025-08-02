import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import "../../styles/main-app/pages/ForgotPasswordPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import config from "../config";
import { forgotPassword, resetPassword } from "../services/auth";

const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Check if this is a reset request (has token) or initial forgot password request
  const resetToken = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');
  const isResetMode = !!resetToken;

  // State for forgot password form
  const [email, setEmail] = useState(emailFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // State for reset password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Handle forgot password request (send reset email)
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email) {
      setError("Email address is required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Using auth service (API calls are commented out in the service)
      await forgotPassword(email);
      
      setSuccess(true);
      toast.success("Password reset instructions sent to your email");
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to send reset email. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset (with token)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Using auth service (API calls are commented out in the service)
      await resetPassword(emailFromUrl, resetToken, newPassword);
      
      toast.success("Password reset successful! You can now login with your new password.");
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to reset password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check password strength
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score < 3) return { label: "Weak", color: "#f85c70" };
    if (score < 5) return { label: "Medium", color: "#ffa726" };
    return { label: "Strong", color: "#66bb6a" };
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  if (isResetMode) {
    // Reset Password Form (accessed via email link)
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="form-container">
            <h1>Reset Your Password</h1>
            <p className="subtitle">Enter your new password below</p>
            
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {passwordStrength && (
                  <div className="password-strength">
                    <div 
                      className="strength-bar" 
                      style={{ 
                        width: `${(getPasswordStrength(newPassword).label === 'Weak' ? 33 : 
                                 getPasswordStrength(newPassword).label === 'Medium' ? 66 : 100)}%`,
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
              
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              {error && <p className="error-message">{error}</p>}
              
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
            
            <p className="back-to-login">
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
          
          <div className="image-container">
            <img src={authImage} alt="Password reset" />
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password Form (initial request)
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="form-container">
          {success ? (
            <div className="success-state">
              <h1>Check Your Email</h1>
              <p className="success-message">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="subtitle">
                Please check your email and follow the instructions to reset your password.
                If you don't see the email, check your spam folder.
              </p>
              <button 
                className="btn secondary" 
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
              >
                Try Different Email
              </button>
              <p className="back-to-login">
                <Link to="/login">Back to Login</Link>
              </p>
            </div>
          ) : (
            <>
              <h1>Forgot Password?</h1>
              <p className="subtitle">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <form onSubmit={handleForgotPasswordSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                {error && <p className="error-message">{error}</p>}
                
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Sending Instructions..." : "Send Reset Instructions"}
                </button>
              </form>
              
              <p className="back-to-login">
                <Link to="/login">Back to Login</Link>
              </p>
            </>
          )}
        </div>
        
        <div className="image-container">
          <img src={authImage} alt="Password reset" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
