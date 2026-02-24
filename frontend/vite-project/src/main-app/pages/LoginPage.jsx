import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import "../../styles/main-app/pages/LoginPage.css";
import { toast } from "react-toastify";
import config from "../config";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/modal/Modal";
import GoogleAuthService from "../services/googleAuthService";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonBgColor, setButtonBgColor] = useState("#00B4A6");
  const [isError, setIsError] = useState(false);

  // Google login state
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, loading: authLoading, login } = useAuth();

  // Get return URL and message from query parameters
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo');
  const message = urlParams.get('message');

  // Only redirect if already authenticated (no duplicate navigation logic)
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole && !showSuccessModal) {
      setRedirecting(true);
      const navigationTimer = setTimeout(() => {
        try {
          toast.dismiss();
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
  }, [isAuthenticated, userRole, authLoading, navigate, returnTo, showSuccessModal]);

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
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { data } = response;

      const userData = {
        ...data,
        authProvider: data.authProvider || 'Local'
      };

      login(userData, data.token, data.refreshToken, data.isFirstLogin);

    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Invalid email or password.";
      setError(null);

      setModalTitle("Login Failed");
      setModalDescription(errorMessage);
      setButtonBgColor("#FF4B4B");
      setButtonText("Try Again");
      setIsError(true);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Google Sign In success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Google sign in failed");
      return;
    }

    setGoogleLoading(true);
    const idToken = credentialResponse.credential;

    try {
      const result = await GoogleAuthService.googleSignIn(idToken);

      const hasToken = !!(result.token || result.accessToken);
      const accessToken = result.token || result.accessToken;

      if (result.success && !result.requiresLinking && hasToken) {
        console.log("Google Sign In API Response:", result);
        GoogleAuthService.storeAuthData(result);

        const userData = {
          id: result.id || result.userId,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role,
          profilePicture: result.profilePicture,
          authProvider: result.authProvider || 'Google',
        };

        login(userData, accessToken, result.refreshToken, result.isFirstLogin);

        setTimeout(() => {
          const dashboardPath = GoogleAuthService.getDashboardPath(result.role);
          window.location.href = dashboardPath;
        }, 1500);

      } else if (result.requiresLinking) {
        const conflictEmail = result.conflict?.email || "this email";
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with ${conflictEmail} already exists. Please sign in with your password first, then you can link your Google account from settings.`);
        setButtonText("Sign In with Password");
        setButtonBgColor("#FF6B6B");
        setIsError(true);
        setIsModalOpen(true);
        toast.info("Please create an account first");
        navigate(returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register");

      } else if (result.canLinkAccounts) {
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with this email (${result.email}) already exists. Please sign in with your password.`);
        setButtonText("Okay");
        setButtonBgColor("#FF6B6B");
        setIsError(true);
        setIsModalOpen(true);

      } else if (result.needsSignUp) {
        setModalTitle("Account Not Found");
        setModalDescription("No account found with this Google account. Please sign up first to create your account, then you can use Google to sign in.");
        setButtonText("Sign Up");
        setButtonBgColor("#00B4A6");
        setIsError(false);
        setIsModalOpen(true);

      } else {
        toast.error(result.error || result.message || "Google sign in failed");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign in failed. Please try again.");
  };

  const handleModalProceed = () => {
    if (buttonText === "Sign Up") {
      setIsModalOpen(false);
      navigate(returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register");
    } else if (isError) {
      setIsModalOpen(false);
    } else {
      setIsModalOpen(false);
      setShowSuccessModal(false);
    }
  };

  // Show loading screen during redirect
  if (redirecting) {
    return (
      <div className="login-page-wrapper">
        <div className="login-page-right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #e6a817', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      {/* Left Panel */}
      <div className="login-page-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <div className="login-page-logo">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="login-page-hero">
          <img src={loginImg} alt="Caregiver" className="hero-image" />
          {/* Floating UI cards */}
          <div className="floating-card floating-browse">
            <span className="floating-tag">Browse service categories</span>
          </div>
          <div className="floating-card floating-category">
            <div className="category-card-inner">
              <div className="category-emoji">😊</div>
              <div>
                <strong>Adult & Elderly Care</strong>
                <p>Dignified, independence-focused assistance to keep seniors active, comfortable, and cared for.</p>
                <span className="category-price">Starting at ₦10,000</span>
              </div>
            </div>
          </div>
          <div className="floating-card floating-orders">
            <span className="orders-icon">🛍️</span>
            <span>Manage active Orders</span>
          </div>
          <div className="floating-card floating-connect">
            <span>Connect with qualified Caregivers</span>
          </div>
          <div className="floating-card floating-profile">
            <div className="profile-row">
              <div className="profile-avatar">FA</div>
              <div className="profile-info">
                <strong>Funke Adeyemi</strong>
                <span className="verified-badge">Verified ✓</span>
                <span className="rating">⭐ 4.5</span>
              </div>
            </div>
            <span className="profile-location">📍 Ikoy, Lagos, Nigeria</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-page-right">
        <div className="login-page-content">
          <h2>Welcome back</h2>

          <p className="login-page-subtitle">
            Don't have an account?{" "}
            <Link to={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"}>
              Sign up →
            </Link>
          </p>

          {message && (
            <div className="login-page-message">
              <p>{decodeURIComponent(message)}</p>
            </div>
          )}

          <form className="login-page-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="login-page-field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="e.g Johnsonsand@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="login-page-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-page-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-page-eye-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.45703 12C3.73128 7.94288 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Helper links */}
            <div className="login-page-helpers">
              <Link to="/forgot-password" className="login-page-helper-link">Forgot Password?</Link>
              <Link to="/resend-confirmation" className="login-page-helper-link">Didn't receive confirmation email?</Link>
            </div>

            {error && <p className="login-page-error">{error}</p>}

            {/* Submit */}
            <button type="submit" className="login-page-submit" disabled={loading || authLoading || redirecting || googleLoading}>
              {loading ? "Logging in..." :
                authLoading ? "Checking authentication..." :
                  redirecting ? "Redirecting..." : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="login-page-divider">
            <span>or</span>
          </div>

          {/* Google Sign In */}
          <div className="login-page-social">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="rectangular"
              width="100%"
              ux_mode="popup"
            />
          </div>

          {/* Terms */}
          <p className="login-page-terms">
            By signing in, you agree to the{" "}
            <Link to="/terms-and-conditions">Terms of use</Link> and{" "}
            <Link to="/privacy-policy">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isError={isError}
        onProceed={handleModalProceed}
      />
    </div>
  );
};

export default LoginPage;
