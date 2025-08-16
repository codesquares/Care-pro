import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import "../../styles/main-app/pages/LoginPage.scss";
import { toast } from "react-toastify";
import config from "../config";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, loading: authLoading, login } = useAuth();

  // Get return URL and message from query parameters
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo');
  const message = urlParams.get('message');

  // Only redirect if already authenticated (no duplicate navigation logic)
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole) {
      // If there's a return URL, use it; otherwise use default dashboard
      if (returnTo) {
        navigate(decodeURIComponent(returnTo), { replace: true });
      } else {
        const dashboardPath = userRole === "Admin" ? "/app/admin/dashboard" :
                             userRole === "Client" ? "/app/client/dashboard" :
                             "/app/caregiver/profile";
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [isAuthenticated, userRole, authLoading, navigate, returnTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${config.BASE_URL}/Authentications/UserLogin`,
        { email, password }
      );

      const { data } = response;
      toast.success("Login successful");
      
      // Use AuthContext login method which returns navigation info
      const navInfo = login(data, data.token, data.refreshToken);
      
      // Navigate using return URL if available, otherwise use AuthContext path
      if (returnTo) {
        navigate(decodeURIComponent(returnTo), { replace: true });
      } else if (navInfo.shouldNavigate) {
        navigate(navInfo.path, { replace: true });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Invalid email or password.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Left section */}
      <div className="login-left">
        <div className="login-logo-section">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="login-image-section">
          <img
            src={loginImg}
            alt="Caregiver"
            className="main-image"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="login-right">
        <h2>Login</h2>
        {message && (
          <div className="login-message">
            <p>{decodeURIComponent(message)}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="e.g Johnsonsand@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-input">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || authLoading}>
            {loading ? "Logging in..." : authLoading ? "Checking authentication..." : "Continue"}
          </button>
        </form>

        <div className="divider">or</div>

        <div className="social-login">
          <button className="google-btn">Google</button>
          <button className="apple-btn">Apple</button>
        </div>

        <p className="signup-text">
          Don’t have an account? <Link to="/register">Signup →</Link>
        </p>

        <p className="terms">
          By creating an account, you agree to the{" "}
          <Link to="#">Terms of use</Link> and{" "}
          <Link to="#">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
