import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../../styles/main-app/pages/ForgotPasswordPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import { forgotPassword, resetPasswordWithToken } from "../services/auth";

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Using auth service - calls backend request-reset endpoint
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
      // Using auth service - calls the token-based reset endpoint
      await resetPasswordWithToken(resetToken, newPassword);
      
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

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
                <div className="password-input">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={toggleNewPasswordVisibility}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.45703 12C3.73128 7.94288 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="password-strength" aria-live="polite">
                  <div className="strength-bar">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: passwordStrength
                          ? `${getPasswordStrength(newPassword).label === 'Weak' ? 33 : getPasswordStrength(newPassword).label === 'Medium' ? 66 : 100}%`
                          : '0%',
                        backgroundColor: passwordStrength ? passwordStrength.color : '#e0e0e0'
                      }}
                    />
                  </div>
                  <span
                    className="strength-text"
                    style={{ color: passwordStrength ? passwordStrength.color : 'transparent' }}
                  >
                    {passwordStrength ? passwordStrength.label : ' '}
                  </span>
                </div>
              </div>
              
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.45703 12C3.73128 7.94288 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              
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
                  style={{ width: '100%', marginBottom: '2rem' }}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                {error && <p className="error-message">{error}</p>}
                
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Sending Reset Link..." : "Send Reset Link"}
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
