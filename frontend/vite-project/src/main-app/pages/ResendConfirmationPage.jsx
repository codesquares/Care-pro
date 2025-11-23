import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/main-app/pages/ResendConfirmationPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import { resendConfirmationEmail } from "../services/auth";
import Modal from "../components/modal/Modal";

const ResendConfirmationPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Back to Login");
  const [buttonBgColor, setButtonBgColor] = useState("#00B4A6");
  const [isError, setIsError] = useState(false);
  const [secondaryButtonText, setSecondaryButtonText] = useState("");
  const [showSecondaryButton, setShowSecondaryButton] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
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
      // Call the resend confirmation email service
      await resendConfirmationEmail(email);
      
      setSuccess(true);
      
      // Show success modal
      setModalTitle("Confirmation Email Sent!");
      setModalDescription(`We've sent a new confirmation email to **${email}**. Please check your email and click the confirmation link to activate your account. If you don't see the email, check your spam folder.`);
      setButtonBgColor("#00B4A6");
      setButtonText("Back to Login");
      setSecondaryButtonText("Send to Different Email");
      setShowSecondaryButton(true);
      setIsError(false);
      setIsModalOpen(true);
      
      // Remove toast since we're using modal
      // toast.success("Confirmation email sent successfully!");
    } catch (err) {
      console.error("Resend confirmation error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to send confirmation email. Please try again.";
      setError(errorMessage);
      
      // Show error modal
      setModalTitle("Failed to Send Email");
      setModalDescription(errorMessage);
      setButtonBgColor("#FF4B4B");
      setButtonText("Try Again");
      setShowSecondaryButton(false);
      setIsError(true);
      setIsModalOpen(true);
      
      // Remove toast since we're using modal
      // toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleModalProceed = () => {
    if (isError) {
      // For error modals, just close and let user try again
      setIsModalOpen(false);
    } else {
      // For success modal, navigate to login
      navigate("/login");
    }
  };

  const handleModalSecondary = () => {
    // For "Send to Different Email" option
    setIsModalOpen(false);
    setSuccess(false);
    setEmail("");
  };

  return (
    <div className="resend-confirmation-page">
      <div className="resend-confirmation-container">
        <div className="form-container">
          <h1>Resend Confirmation Email</h1>
          <p className="subtitle">
            Enter your email address and we'll send you a new confirmation link to activate your account.
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {error && <p className="error-message">{error}</p>}
            
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Sending Email..." : "Send Confirmation Email"}
            </button>
          </form>
          
          <div className="help-text">
            <p>
              <strong>Didn't receive the email?</strong>
            </p>
            <ul>
              <li>Check your spam or junk mail folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Check if your email provider is blocking emails from CarePro</li>
            </ul>
          </div>
          
          <div className="action-links">
            <Link to="/login" className="link">Back to Login</Link>
            <span className="separator">•</span>
            <Link to="/register" className="link">Create New Account</Link>
          </div>
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

export default ResendConfirmationPage;

