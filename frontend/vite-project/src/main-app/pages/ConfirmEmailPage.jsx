import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../../styles/main-app/pages/ConfirmEmailPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import { validateEmailToken, confirmEmail } from "../services/auth";
import Modal from "../components/modal/Modal";

/**
 * ConfirmEmailPage Component
 * 
 * This page handles email confirmation for both caregivers and clients.
 * 
 * The backend endpoints are available at:
 * - /api/CareGivers/validate-email-token
 * - /api/CareGivers/confirm-email  
 * - /api/Clients/validate-email-token
 * - /api/Clients/confirm-email
 */

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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Go to Login");
  const [buttonBgColor, setButtonBgColor] = useState("#00B4A6");
  const [isError, setIsError] = useState(false);
  const [secondaryButtonText, setSecondaryButtonText] = useState("");
  const [showSecondaryButton, setShowSecondaryButton] = useState(false);

  // Auto-confirm email when component mounts if we have the required parameters
  useEffect(() => {
    if (token && !confirmationAttempted) {
      handleEmailConfirmation();
    } else if (!token) {
      setError("Invalid confirmation link. Missing required parameters.");
      
      // Show error modal for missing token
      setModalTitle("Invalid Confirmation Link");
      setModalDescription("The confirmation link appears to be invalid or incomplete. Please check your email for the correct confirmation link, or register for a new account.");
      setButtonBgColor("#FF4B4B");
      setButtonText("Register Again");
      setSecondaryButtonText("Back to Login");
      setShowSecondaryButton(true);
      setIsError(true);
      setIsModalOpen(true);
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
        throw new Error(tokenValidationResult.message || 'Invalid or expired confirmation token');
      }
      
      setUserInfo(tokenValidationResult);
      
      // Step 2: Use the userId from token validation to confirm email
      await confirmEmail(tokenValidationResult.userId);
      
      setSuccess(true);
      
      // Show success modal
      setModalTitle("Email Confirmed!");
      setModalDescription(
        userInfo?.email 
          ? `Your email address **${userInfo.email}** has been successfully verified. You can now login to your account with full access to all features.`
          : "Your email confirmation link has been processed. You can now proceed to login to your account with full access to all features."
      );
      setButtonBgColor("#00B4A6");
      setButtonText("Go to Login");
      setIsError(false);
      setShowSecondaryButton(false);
      setIsModalOpen(true);
      
      // Remove the toast since we're using modal
      // toast.success("Email confirmed successfully! You can now login to your account.");
      
      // Auto-redirect after 5 seconds if user doesn't click
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err) {
      console.error("Email confirmation error:", err);
      
      // Handle specific error cases
      let errorMessage = "Failed to confirm email. Please try again.";
      
      if (err.message) {
        if (err.message.includes('User not found') || err.message.includes('caregiver id not existing') || err.message.includes('Client with ID') || err.message.includes('Caregiver with ID')) {
          errorMessage = "This confirmation link appears to be for a different user type or the user account could not be found. Please check the link or try registering again.";
        } else if (err.message.includes('Invalid or expired') || err.message.includes('JWT must have')) {
          errorMessage = "This confirmation link has expired or is invalid. Please request a new confirmation email.";
        } else if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (err.message.includes('404') || err.message.includes('endpoint') || err.message.includes('temporarily unavailable')) {
          errorMessage = "Email confirmation service is temporarily unavailable. Please try again later or contact support.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Show error modal
      setModalTitle("Email Confirmation Failed");
      setModalDescription(getErrorDescription(errorMessage));
      setButtonBgColor("#FF4B4B");
      setButtonText(token ? "Try Again" : "Go to Login");
      setIsError(true);
      
      // Show secondary button for additional options
      if (token) {
        setSecondaryButtonText("Register Again");
        setShowSecondaryButton(true);
      } else {
        setShowSecondaryButton(false);
      }
      
      setIsModalOpen(true);
      
      // Remove toast since we're using modal
      // toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get detailed error descriptions for modal
  const getErrorDescription = (errorMessage) => {
    if (errorMessage.includes('user type') || errorMessage.includes('different user')) {
      return "This confirmation link may be for a different account type (client vs caregiver) or the account may not exist. Please try registering with the correct account type or contact support.";
    } else if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      return "This confirmation link has expired or is no longer valid. Please try registering again to receive a new confirmation email.";
    } else if (errorMessage.includes('service') || errorMessage.includes('temporarily unavailable')) {
      return "Our email confirmation service is temporarily experiencing issues. Please try again in a few minutes or contact support if the problem persists.";
    } else {
      return "This could happen if the confirmation link has expired, has already been used, or if there's a temporary service issue. Please try registering again or contact support.";
    }
  };

  // Modal handlers
  const handleModalProceed = () => {
    if (isError) {
      if (buttonText === "Try Again") {
        setIsModalOpen(false);
        handleRetry();
      } else {
        navigate("/login");
      }
    } else {
      // Success case - go to login
      navigate("/login");
    }
  };

  const handleModalSecondary = () => {
    navigate("/register");
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
          ) : (
            <div className="waiting-state">
              <h1>Email Confirmation</h1>
              <p className="subtitle">
                Processing your email confirmation...
              </p>
            </div>
          )}
        </div>
        
        <div className="image-container">
          <img src={authImage} alt="Email confirmation" />
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
        secondaryButtonText={showSecondaryButton ? secondaryButtonText : undefined}
        onSecondaryAction={showSecondaryButton ? handleModalSecondary : undefined}
        onProceed={handleModalProceed}
      />
    </div>
  );
};

export default ConfirmEmailPage;
