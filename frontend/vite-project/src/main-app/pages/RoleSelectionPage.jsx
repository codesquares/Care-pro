import { useEffect } from "react";
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

  // Handle role card click - navigate to registration form
  const handleRoleSelect = (role) => {
    navigate("/register/form", { state: { role, returnTo } });
  };

  return (
    <div className="role-selection-wrapper">
      <div className="role-selection-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <div className="role-selection-logo">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="role-selection-image">
          <img src={loginImg} alt="Caregiver" className="main-image" />
        </div>
      </div>

      <div className="role-selection-right">
        <h2>Join CarePro</h2>
        <p className="role-selection-subtitle">
          Choose how you want to use CarePro
        </p>

        <div className="role-cards-container">
          {/* Client Card */}
          <div 
            className="role-card"
            onClick={() => handleRoleSelect("Client")}
          >
            <div className="role-card-icon">👤</div>
            <h3>I'm a Client</h3>
            <p>I'm looking for quality care services for myself or a loved one</p>
            <ul className="role-benefits">
              <li>✓ Find verified caregivers</li>
              <li>✓ Book services easily</li>
              <li>✓ Secure payments</li>
            </ul>
          </div>

          {/* Caregiver Card */}
          <div 
            className="role-card"
            onClick={() => handleRoleSelect("Caregiver")}
          >
            <div className="role-card-icon">🏥</div>
            <h3>I'm a Caregiver</h3>
            <p>I provide professional care services and want to grow my business</p>
            <ul className="role-benefits">
              <li>✓ Reach more clients</li>
              <li>✓ Manage bookings</li>
              <li>✓ Get paid securely</li>
            </ul>
          </div>
        </div>

        <p className="signin-text">
          Already have an account? <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
