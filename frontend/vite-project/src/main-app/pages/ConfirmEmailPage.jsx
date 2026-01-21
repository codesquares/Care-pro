import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/main-app/pages/ConfirmEmailPage.css";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import { validateEmailToken, confirmEmail } from "../services/auth";
import Modal from "../components/modal/Modal";

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Go to Login");
  const [buttonBgColor, setButtonBgColor] = useState("#00B4A6");
  const [isError, setIsError] = useState(false);
  const [secondaryButtonText, setSecondaryButtonText] = useState("");
  const [showSecondaryButton, setShowSecondaryButton] = useState(false);

  useEffect(() => {
    if (token && !confirmationAttempted) {
      handleEmailConfirmation();
    } else if (!token) {
      setError("Invalid confirmation link. Missing required parameters.");
      setModalTitle("Invalid Confirmation Link");
      setModalDescription(
        "The confirmation link appears to be invalid or incomplete. Please check your email for the correct confirmation link, or register for a new account."
      );
      setButtonBgColor("#FF4B4B");
      setButtonText("Register Again");
      setSecondaryButtonText("Back to Login");
      setShowSecondaryButton(true);
      setIsError(true);
      setIsModalOpen(true);
    }
  }, [token, confirmationAttempted]);

  const handleEmailConfirmation = async () => {
    if (confirmationAttempted) return;

    setConfirmationAttempted(true);
    setError(null);
    setLoading(true);

    try {
      const tokenValidationResult = await validateEmailToken(token);

      if (!tokenValidationResult.success) {
        throw new Error(tokenValidationResult.message || "Invalid or expired confirmation token");
      }

      setUserInfo(tokenValidationResult);

      await confirmEmail(tokenValidationResult.userId);

      const confirmedEmail = tokenValidationResult?.email;
      const successMessage = confirmedEmail
        ? `Your email address **${confirmedEmail}** has been successfully verified. You can now login to your account with full access to all features.`
        : "Your email confirmation link has been processed. You can now proceed to login to your account with full access to all features.";

      setSuccess(true);
      setModalTitle("Email Confirmed!");
      setModalDescription(successMessage);
      setButtonBgColor("#00B4A6");
      setButtonText("Go to Login");
      setIsError(false);
      setShowSecondaryButton(false);
      setIsModalOpen(true);

      setTimeout(() => navigate("/login"), 5000);
    } catch (err) {
      console.error("Email confirmation error:", err);

      let errorMessage = "Failed to confirm email. Please try again.";

      if (err.message) {
        if (
          err.message.includes("User not found") ||
          err.message.includes("caregiver id not existing") ||
          err.message.includes("Client with ID") ||
          err.message.includes("Caregiver with ID")
        ) {
          errorMessage =
            "This confirmation link appears to be for a different user type or the user account could not be found. Please check the link or try registering again.";
        } else if (err.message.includes("Invalid or expired") || err.message.includes("JWT must have")) {
          errorMessage = "This confirmation link has expired or is invalid. Please request a new confirmation email.";
        } else if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (
          err.message.includes("404") ||
          err.message.includes("endpoint") ||
          err.message.includes("temporarily unavailable")
        ) {
          errorMessage = "Email confirmation service is temporarily unavailable. Please try again later or contact support.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setModalTitle("Email Confirmation Failed");
      setModalDescription(getErrorDescription(errorMessage));
      setButtonBgColor("#FF4B4B");
      setButtonText(token ? "Try Again" : "Go to Login");
      setIsError(true);

      if (token) {
        setSecondaryButtonText("Register Again");
        setShowSecondaryButton(true);
      } else {
        setShowSecondaryButton(false);
      }

      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getErrorDescription = (message) => {
    if (message.includes("user type") || message.includes("different user")) {
      return "This confirmation link may be for a different account type (client vs caregiver) or the account may not exist. Please try registering with the correct account type or contact support.";
    }
    if (message.includes("expired") || message.includes("invalid")) {
      return "This confirmation link has expired or is no longer valid. Please try registering again to receive a new confirmation email.";
    }
    if (message.includes("service") || message.includes("temporarily unavailable")) {
      return "Our email confirmation service is temporarily experiencing issues. Please try again in a few minutes or contact support if the problem persists.";
    }
    return "This could happen if the confirmation link has expired, has already been used, or if there's a temporary service issue. Please try registering again or contact support.";
  };

  const handleModalProceed = () => {
    if (isError) {
      if (buttonText === "Try Again") {
        setIsModalOpen(false);
        handleRetry();
      } else {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  };

  const handleModalSecondary = () => {
    navigate("/register");
  };

  const handleRetry = () => {
    if (loading) return;
    setConfirmationAttempted(false);
    setError(null);
    setSuccess(false);
    handleEmailConfirmation();
  };

  const renderStatusContent = () => {
    if (loading) {
      return (
        <div className="confirm-email-state loading-state">
          <div className="spinner" />
          <h2>Confirming Your Email</h2>
          <p className="confirm-subtitle">Please wait while we verify your email address.</p>
        </div>
      );
    }

    if (success) {
      return (
        <div className="confirm-email-state success-state">
          <h2>Email Confirmed</h2>
          <p className="confirm-subtitle">
            {userInfo?.email
              ? `Your email address ${userInfo.email} has been verified.`
              : "Your email address has been verified successfully."}
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate("/login")}>
            Go to Login
          </button>
          <p className="status-note">Redirecting you shortly...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="confirm-email-state error-state">
          <h2>We Couldn't Confirm</h2>
          <p className="confirm-subtitle">{error}</p>
          {token && (
            <button type="button" className="btn-primary" onClick={handleRetry}>
              Try Again
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => navigate("/register")}>
            Register Again
          </button>
        </div>
      );
    }

    return (
      <div className="confirm-email-state waiting-state">
        <h2>Email Confirmation</h2>
        <p className="confirm-subtitle">Processing your email confirmation...</p>
        {token && (
          <button type="button" className="btn-primary" onClick={handleRetry}>
            Refresh Status
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="login-wrapper confirm-email-page">
      <div className="login-left" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <div className="login-logo-section">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="login-image-section">
          <img src={loginImg} alt="Caregiver" className="main-image" />
        </div>
      </div>

      <div className="login-right">
        <div className="confirm-email-content">{renderStatusContent()}</div>
      </div>

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
