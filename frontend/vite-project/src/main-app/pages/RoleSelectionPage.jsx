import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../../styles/main-app/pages/RoleSelectionPage.css";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import GoogleAuthService from "../services/googleAuthService";
import { useAuth } from "../context/AuthContext";

/**
 * RoleSelectionPage - First step of registration
 * User selects their role (Client/Caregiver)
 */
const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  // Get returnTo from URL parameters to preserve through auth flow
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole) {
      const dashboardPath = GoogleAuthService.getDashboardPath(userRole);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, userRole, authLoading, navigate]);

  // Handle Create Account click
  const handleCreateAccount = () => {
    if (!selectedRole) return;
    navigate("/register/form", { state: { role: selectedRole, returnTo } });
  };

  return (
    <div className="role-selection-wrapper">
      {/* Left Panel */}
      <div className="role-selection-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <div className="role-selection-logo">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="role-selection-hero">
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
      <div className="role-selection-right">
        <div className="role-selection-content">
          <h2>Join as a client or caregiver</h2>

          <div className="role-cards-container">
            {/* Client Card */}
            <div
              className={`role-card ${selectedRole === "Client" ? "selected" : ""}`}
              onClick={() => setSelectedRole("Client")}
            >
              <div className="role-card-top">
                <svg className="role-card-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <div className="role-card-text">
                  <span>I'm a client,</span>
                  <span>looking for caregiver</span>
                </div>
                <div className={`role-radio ${selectedRole === "Client" ? "checked" : ""}`}>
                  <div className="radio-dot" />
                </div>
              </div>
            </div>

            {/* Caregiver Card */}
            <div
              className={`role-card ${selectedRole === "Caregiver" ? "selected" : ""}`}
              onClick={() => setSelectedRole("Caregiver")}
            >
              <div className="role-card-top">
                <svg className="role-card-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" fill="none" />
                </svg>
                <div className="role-card-text">
                  <span>I'm a caregiver,</span>
                  <span>looking for work</span>
                </div>
                <div className={`role-radio ${selectedRole === "Caregiver" ? "checked" : ""}`}>
                  <div className="radio-dot" />
                </div>
              </div>
            </div>
          </div>

          <button
            className={`create-account-btn ${selectedRole ? "active" : ""}`}
            disabled={!selectedRole}
            onClick={handleCreateAccount}
          >
            Create Account
          </button>

          <p className="signin-text">
            Already have an account?{" "}
            <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>
              Log in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
