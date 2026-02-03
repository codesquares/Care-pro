import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../../styles/main-app/pages/RegisterPage.css";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import useApi from "../services/useApi";
import { toast } from "react-toastify";
import Modal from "../components/modal/Modal"; 
import allUserService from "../services/allUserService";
import GoogleAuthService from "../services/googleAuthService";
import { useAuth } from "../context/AuthContext";

/**
 * RegisterFormPage - Registration form (step 2)
 * User fills in their details after selecting their role
 */
const RegisterFormPage = () => {
  const { data, error, loading, fetchData } = useApi("", "post");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get role from navigation state
  const selectedRole = location.state?.role;

  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    // phone: "",
    confirmPassword: "",
  });

  // Redirect if no role selected
  useEffect(() => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      navigate("/register", { replace: true });
    }
  }, [selectedRole, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user && user.role) {
      if (user.role === "Caregiver") {
        navigate("/app/caregiver/profile", { replace: true });
      } else if (user.role === "Client") {
        navigate("/app/client/dashboard", { replace: true });
      } else if (user.role === "Admin") {
        navigate("/app/admin/dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }
  }, [navigate]);

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");
  const [isEmailVerification, setIsEmailVerification] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Google auth state
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formValues.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formValues.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formValues.email.trim() || !/\S+@\S+\.\S+/.test(formValues.email))
      newErrors.email = "Valid email address is required.";
    if (!formValues.password || formValues.password.length < 8) 
      newErrors.password = "Password must be at least 8 characters long.";
    if (formValues.password !== formValues.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (isSubmitted) {
      setErrors(validate());
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    // Check if email already exists in the system
    try {
      console.log("Checking if email exists:", formValues.email);
      const emailCheck = await allUserService.checkEmailExists(formValues.email);
      
      if (emailCheck.exists) {
        // Show modal asking user to login instead
        setModalTitle("Email Already Registered");
        setModalDescription(`An account with the email **${formValues.email}** already exists as a ${emailCheck.role}. 

Please log in to your existing account instead of creating a new one.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);
        return;
      }
    } catch (emailCheckError) {
      console.error("Error checking email existence:", emailCheckError);
      toast.error("Unable to verify email availability. Please try again.");
      return;
    }

    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      // phoneNo: formValues.phone,
      middleName: "testing",
      password: formValues.password,
      role: selectedRole,
    };

    try {
      const endpoint = selectedRole === "Caregiver"
        ? "/CareGivers/AddCaregiverUser"
        : selectedRole === "Client"
        ? "/Clients/AddClientUser"
        : "/Admins/AddAdminUser";

      await fetchData(payload, endpoint);

      // Show success modal with email verification instructions
      setModalTitle("Registration Successful!");
      setModalDescription(`Your account has been created successfully! 

We've sent a verification email to **${formValues.email}**. Please check your inbox and click the verification link to activate your account.

You won't be able to log in until your email is verified.`);
      setButtonBgColor("#00B4A6");
      setButtonText("Go to Login");
      setIsEmailVerification(true);
      setIsError(false);
      setIsModalOpen(true);
      
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error("Registration failed. Please try again.");

      // Show error modal
      setModalTitle("Registration Failed");
      setModalDescription("Something went wrong during registration. Please check your information and try again.");
      setButtonBgColor("#FF4B4B");
      setButtonText("Try Again");
      setIsEmailVerification(false);
      setIsError(true);
      setIsModalOpen(true);
    }
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    if (buttonText === "Go to Login") {
      navigate("/login");
    }
  };

  const handleResendEmail = () => {
    setIsModalOpen(false);
    navigate("/resend-confirmation");
  };

  // Google Sign Up success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Google sign up failed");
      return;
    }
    
    setGoogleLoading(true);
    const idToken = credentialResponse.credential;
    
    try {
      // Try to sign in first (check if user already exists)
      const signInResult = await GoogleAuthService.googleSignIn(idToken);
      
      // Backend returns 'token' not 'accessToken'
      const hasToken = !!(signInResult.token || signInResult.accessToken);
      const accessToken = signInResult.token || signInResult.accessToken;

      if (signInResult.success && !signInResult.requiresLinking && hasToken) {
        GoogleAuthService.storeAuthData(signInResult);
        
        // Update AuthContext
        // Backend returns 'id' not 'userId'
        const userData = {
          id: signInResult.id || signInResult.userId,
          email: signInResult.email,
          firstName: signInResult.firstName,
          lastName: signInResult.lastName,
          role: signInResult.role,
          profilePicture: signInResult.profilePicture,
        };
        login(userData, accessToken, signInResult.refreshToken);
        
        toast.success("Welcome back! You already have an account.");
        setTimeout(() => {
          const dashboardPath = GoogleAuthService.getDashboardPath(signInResult.role);
          window.location.href = dashboardPath;
        }, 1000);
        
      } else if (signInResult.requiresLinking) {
        // User has a local account - prompt to sign in with password
        const conflictEmail = signInResult.conflict?.email || "this email";
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with ${conflictEmail} already exists. Please sign in with your password first, then you can link your Google account from settings.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);
        
      } else if (signInResult.needsSignUp) {
        // New user - sign them up with the selected role
        const signUpResult = await GoogleAuthService.googleSignUp(idToken, selectedRole);
        
        // Backend returns 'token' not 'accessToken'
        const signUpToken = signUpResult.token || signUpResult.accessToken;

        if (signUpResult.success) {
          GoogleAuthService.storeAuthData(signUpResult);
          
          // Update AuthContext
          // Backend returns 'id' not 'userId'
          const userData = {
            id: signUpResult.id || signUpResult.userId,
            email: signUpResult.email,
            firstName: signUpResult.firstName,
            lastName: signUpResult.lastName,
            role: signUpResult.role || selectedRole,
            profilePicture: signUpResult.profilePicture,
          };
          login(userData, signUpToken, signUpResult.refreshToken);
          
          toast.success("Account created successfully!");
          
          setModalTitle("Welcome to CarePro!");
          setModalDescription(`Your ${selectedRole.toLowerCase()} account has been created successfully with Google. You'll be redirected to your dashboard.`);
          setButtonBgColor("#00B4A6");
          setButtonText("Continue");
          setIsEmailVerification(false);
          setIsError(false);
          setIsModalOpen(true);
          
          setTimeout(() => {
            const dashboardPath = GoogleAuthService.getDashboardPath(selectedRole);
            window.location.href = dashboardPath;
          }, 2000);
        } else {
          toast.error(signUpResult.error || "Google sign up failed");
        }
        
      } else if (signInResult.canLinkAccounts) {
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with this email already exists. Please sign in with your password, then you can link your Google account from settings.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);
        
      } else {
        toast.error(signInResult.error || "Google sign up failed");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleGoogleError = () => {
    toast.error("Google sign up failed. Please try again.");
  };  

  // Don't render if no role
  if (!selectedRole) {
    return null;
  }

  return (
    <div className="login-wrapper">
      <div className="login-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <div className="login-logo-section">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="login-image-section">
          <img src={loginImg} alt="Caregiver" className="main-image" />
        </div>
      </div>
      <div className="login-right">
        <div className="role-badge">
          {selectedRole === "Client" ? "👤" : "🏥"} Creating {selectedRole} Account
        </div>
        <h2>Create your account</h2>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <div>
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formValues.firstName}
                onChange={handleChange}
                required
              />
              {errors.firstName && <p className="error-text">{errors.firstName}</p>}
            </div>
            <div>
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formValues.lastName}
                onChange={handleChange}
                required
              />
              {errors.lastName && <p className="error-text">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formValues.email}
              onChange={handleChange}
              required
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          {/* <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formValues.phone}
              onChange={handleChange}
              required
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div> */}
          <div className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formValues.password}
              onChange={handleChange}
              required
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
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div className="password-input">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formValues.confirmPassword}
              onChange={handleChange}
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
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="btn-primary" disabled={loading || googleLoading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        {/* Google Sign Up Option */}
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
            width="100%"
            ux_mode="popup"
          />
        </div>
        
        <button 
          className="back-link"
          onClick={() => navigate("/register")}
        >
          ← Back to role selection
        </button>
        
        <p className="signup-text">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
        
        {error && <p className="error-text">Error: {error.message}</p>}
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isEmailVerification={isEmailVerification}
        isError={isError}
        secondaryButtonText={isEmailVerification ? "Didn't receive email?" : undefined}
        onSecondaryAction={isEmailVerification ? handleResendEmail : undefined}
        onProceed={handleProceed}
      />
    </div>
  );
};

export default RegisterFormPage;
