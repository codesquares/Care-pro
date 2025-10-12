import { useState, useEffect } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
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
      setRedirecting(true);
      // Reduced delay since toast auto-closes in 1.5s
      const navigationTimer = setTimeout(() => {
        try {
          // Dismiss any remaining toasts before navigation
          toast.dismiss();
          
          // If there's a return URL, use it; otherwise use default dashboard
          if (returnTo) {
            navigate(decodeURIComponent(returnTo), { replace: true });
          } else {
            const dashboardPath = userRole === "Admin" ? "/app/admin/dashboard" :
                                 userRole === "Client" ? "/app/client/dashboard" :
                                 "/app/caregiver/profile";
            navigate(dashboardPath, { replace: true });
          }
        } catch (error) {
          console.error('Navigation error:', error);
          setRedirecting(false);
          setError('Navigation failed. Please try refreshing the page.');
        }
      }, 1600);
      
      return () => {
        clearTimeout(navigationTimer);
        setRedirecting(false);
      };
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
      
      // Show success toast and store the toast ID
      const toastId = toast.success("Login successful", {
        toastId: 'login-success',
        autoClose: 1500,
        containerId: 'main-toast-container',
        closeOnClick: false,
        draggable: false,
        pauseOnHover: false
      });
      
      // Update authentication state
      login(data, data.token, data.refreshToken);
      
      // Dismiss the toast before navigation to prevent conflicts
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 1000);
      
      // Navigation will be handled by the useEffect that watches isAuthenticated
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Invalid email or password.";
      setError(errorMessage);
      toast.error(errorMessage, {
        containerId: 'main-toast-container',
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Show loading screen during redirect to prevent flash of content
  if (redirecting) {
    return (
      <div className="login-wrapper">
        <div className="login-right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      {/* Left section */}
      <div className="login-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
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
          <div className="auth-password-input" style={{ width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
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

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || authLoading || redirecting}>
            {loading ? "Logging in..." : 
             authLoading ? "Checking authentication..." : 
             redirecting ? "Redirecting..." : "Continue"}
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
