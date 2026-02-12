import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import "../../styles/main-app/pages/RoleSelectionPage.css";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import GoogleAuthService from "../services/googleAuthService";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/modal/Modal";

/**
 * RoleSelectionPage - First step of registration
 * User selects their role (Client/Caregiver) or signs up with Google
 */
const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userRole, loading: authLoading, login } = useAuth();

  // Get returnTo from URL parameters to preserve through auth flow
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo');
  
  // Google auth state
  const [googleIdToken, setGoogleIdToken] = useState(null);
  const [showRoleForGoogle, setShowRoleForGoogle] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonBgColor, setButtonBgColor] = useState("#00B4A6");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole) {
      const dashboardPath = GoogleAuthService.getDashboardPath(userRole);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, userRole, authLoading, navigate]);

  // Handle role card click (manual signup)
  const handleRoleSelect = (role) => {
    if (googleIdToken && showRoleForGoogle) {
      // Google signup flow
      handleGoogleSignUp(role);
    } else {
      // Manual signup flow - navigate to form
      navigate("/register/form", { state: { role, returnTo } });
    }
  };

  // Handle Google Sign In success
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("🔍 handleGoogleSuccess CALLED - credentialResponse:", credentialResponse);
    
    if (!credentialResponse.credential) {
      console.log("🔍 No credential in response");
      toast.error("Google sign in failed");
      return;
    }
    
    setGoogleLoading(true);
    const idToken = credentialResponse.credential;
    console.log("🔍 Got idToken, calling backend...");
    
    try {
      // Try to sign in with ID token
      const result = await GoogleAuthService.googleSignIn(idToken);
      
      // Debug: Log the full response from backend
      console.log("🔍 Google Sign In - Full API Response:", JSON.stringify(result, null, 2));
      console.log("🔍 Role from response:", result.role);
      // Backend returns 'token' not 'accessToken'
      const hasToken = !!(result.token || result.accessToken);
      console.log("🔍 Token exists:", hasToken, "(token:", !!result.token, "accessToken:", !!result.accessToken, ")");
      console.log("🔍 requiresLinking:", result.requiresLinking);
      console.log("🔍 needsSignUp:", result.needsSignUp);

      if (result.success && !result.requiresLinking && hasToken) {
        // Normalize role - handle different casing from backend
        const userRole = result.role || result.Role || result.userRole;
        
        console.log("🔍 Normalized role:", userRole);
        
        GoogleAuthService.storeAuthData(result);
        
        // Update AuthContext
        // Backend returns 'id' not 'userId', and 'token' not 'accessToken'
        const userData = {
          id: result.id || result.userId || result.UserId,
          email: result.email || result.Email,
          firstName: result.firstName || result.FirstName,
          lastName: result.lastName || result.LastName,
          role: userRole,
          profilePicture: result.profilePicture || result.ProfilePicture,
          authProvider: result.authProvider || result.AuthProvider || 'Google',
        };
        
        const accessToken = result.token || result.accessToken;
        
        console.log("🔍 User data being stored:", userData);
        console.log("🔍 Access token for login:", accessToken ? accessToken.substring(0, 20) + "..." : "MISSING");
        
        login(userData, accessToken, result.refreshToken, result.isFirstLogin);
        
        // Verify localStorage was set correctly
        console.log("🔍 Stored authToken:", localStorage.getItem("authToken"));
        console.log("🔍 Stored userDetails:", localStorage.getItem("userDetails"));
        
        toast.success("Welcome back!");
        
        const dashboardPath = GoogleAuthService.getDashboardPath(userRole);
        console.log("🔍 Redirecting to:", dashboardPath);
        
        setTimeout(() => {
          window.location.href = dashboardPath;
        }, 1000);
        
      } else if (result.requiresLinking) {
        // Check if this is actually a Google account (backend bug workaround)
        const authProvider = result.conflict?.authProvider || result.conflict?.AuthProvider;
        console.log("🔍 requiresLinking - authProvider:", authProvider);
        console.log("🔍 requiresLinking - conflict object:", result.conflict);
        
        if (authProvider === "Google" || authProvider === "google") {
          // This is a Google account - backend shouldn't require linking
          // Try to get the user's role from conflict and proceed
          const userRole = result.conflict?.role || result.conflict?.Role;
          const userId = result.conflict?.userId || result.conflict?.id;
          const email = result.conflict?.email || result.conflict?.Email;
          
          if (userRole && result.conflict?.accessToken) {
            // If we got tokens in conflict, use them
            GoogleAuthService.storeAuthData({
              ...result.conflict,
              accessToken: result.conflict.accessToken,
            });
            
            const userData = {
              id: userId,
              email: email,
              firstName: result.conflict?.firstName,
              lastName: result.conflict?.lastName,
              role: userRole,
              profilePicture: result.conflict?.profilePicture,
            };
            login(userData, result.conflict.accessToken, result.conflict.refreshToken, result.conflict?.isFirstLogin);
            
            toast.success("Welcome back!");
            setTimeout(() => {
              window.location.href = GoogleAuthService.getDashboardPath(userRole);
            }, 1000);
          } else {
            // Backend bug: Google account but no tokens provided
            // Show error and suggest contacting support
            toast.error("Authentication issue. Your account exists but couldn't be verified. Please try again or contact support.");
            console.error("🔍 Backend bug: Google account requiresLinking but no tokens", result);
          }
        } else {
          // User has a local account - prompt to sign in with password
          const conflictEmail = result.conflict?.email || "this email";
          setModalTitle("Account Already Exists");
          setModalDescription(`An account with ${conflictEmail} already exists. Please sign in with your password first, then you can link your Google account from settings.`);
          setButtonText("Go to Login");
          setButtonBgColor("#FF6B6B");
          setIsModalOpen(true);
        }
        
      } else if (result.needsSignUp) {
        // New user - store the ID token and show role selection
        setGoogleIdToken(idToken);
        setShowRoleForGoogle(true);
        toast.info("Please select your role to complete signup");
        
      } else if (result.canLinkAccounts) {
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with this email (${result.email}) already exists. Please sign in with your password, then you can link your Google account from settings.`);
        setButtonText("Go to Login");
        setButtonBgColor("#FF6B6B");
        setIsModalOpen(true);
        
      } else {
        toast.error(result.error || "Google sign in failed");
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

  // Handle Google signup with selected role
  const handleGoogleSignUp = async (role) => {
    if (!googleIdToken) return;
    
    setGoogleLoading(true);

    try {
      const result = await GoogleAuthService.googleSignUp(googleIdToken, role);

      if (result.success) {
        // Store auth data
        GoogleAuthService.storeAuthData(result);
        
        // Update AuthContext
        const userData = {
          id: result.userId,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role || role,
          profilePicture: result.profilePicture,
          authProvider: result.authProvider || 'Google',
        };
        login(userData, result.accessToken, result.refreshToken, result.isFirstLogin);
        
        toast.success("Account created successfully!");
        
        // Show success modal
        setModalTitle("Welcome to CarePro!");
        setModalDescription(`Your ${role.toLowerCase()} account has been created successfully. You'll be redirected to your dashboard.`);
        setButtonText("Continue");
        setButtonBgColor("#00B4A6");
        setIsModalOpen(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          const dashboardPath = GoogleAuthService.getDashboardPath(role);
          window.location.href = dashboardPath;
        }, 2000);
        
      } else {
        toast.error(result.error || "Sign up failed");
        // Reset Google state
        setGoogleIdToken(null);
        setShowRoleForGoogle(false);
      }
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (buttonText === "Go to Login") {
      navigate(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login");
    }
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
        <h2>{showRoleForGoogle ? "Complete Your Signup" : "Join CarePro"}</h2>
        <p className="role-selection-subtitle">
          {showRoleForGoogle 
            ? "Select your role to finish creating your account"
            : "Choose how you want to use CarePro"
          }
        </p>

        <div className="role-cards-container">
          {/* Client Card */}
          <div 
            className={`role-card ${googleLoading ? 'disabled' : ''}`}
            onClick={() => !googleLoading && handleRoleSelect("Client")}
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
            className={`role-card ${googleLoading ? 'disabled' : ''}`}
            onClick={() => !googleLoading && handleRoleSelect("Caregiver")}
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

        {/* Google Sign Up - Only show if not in Google signup flow */}
        {!showRoleForGoogle && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>

            <div className="google-signup-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                shape="rectangular"
                width="100%"
                ux_mode="popup"
              />
            </div>
          </>
        )}

        {/* Back button for Google flow */}
        {showRoleForGoogle && (
          <button 
            className="back-button"
            onClick={() => {
              setGoogleIdToken(null);
              setShowRoleForGoogle(false);
            }}
          >
            ← Back to options
          </button>
        )}

        <p className="signin-text">
          Already have an account? <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>Sign in →</Link>
        </p>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        onProceed={handleModalClose}
      />
    </div>
  );
};

export default RoleSelectionPage;
