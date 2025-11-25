
import { useNavigate } from "react-router-dom";
import "./verify-button.css";

/**
 * A button component that redirects caregivers to the verification page
 * Updated to handle multiple verification records with priority logic
 */
const VerifyButton = ({ verificationStatus }) => {
  const navigate = useNavigate();

  // Redirect to verification page when clicked
  const handleVerifyClick = () => {
    navigate("/app/caregiver/verification");
  };

  // Navigate to assessments when verification is complete
  const handleAssessmentClick = () => {
    navigate("/app/caregiver/assessment");
  };

  // Normalize status to lowercase for comparison
  const normalizedStatus = verificationStatus?.toLowerCase?.() || verificationStatus || '';
  
  console.log('VerifyButton - received status:', verificationStatus, 'normalized:', normalizedStatus);

  // Show the button with text processing verification if verification is pending
  if (normalizedStatus === "pending") {
    return (
      <button className="verify-button verify-button-pending" disabled>
        Processing Verification...
      </button>
    );
  }

  // Handle different verification statuses with enhanced logic
  const getButtonContent = () => {
    // Handle the main statuses: "successful", "completed", "success", "verified"
    if (
      normalizedStatus === "successful" || 
      normalizedStatus === "completed" || 
      normalizedStatus === "success" || 
      normalizedStatus === "verified"
    ) {
      return {
        text: "Start Assessment",
        className: "verify-button verify-button-success",
        onClick: handleAssessmentClick,
        showCheckmark: true,
        disabled: false,
      };
    }
    
    if (normalizedStatus === "pending") {
      return {
        text: "Verification Pending...",
        className: "verify-button verify-button-pending",
        disabled: true,
      };
    }
    
    if (normalizedStatus === "failed") {
      return {
        text: "Retry Verification",
        className: "verify-button verify-button-retry",
        onClick: handleVerifyClick,
        disabled: false,
      };
    }
    
    // Default case for not_verified or any other status
    return {
      text: "Get Verified",
      className: "verify-button",
      onClick: handleVerifyClick,
      disabled: false,
    };
  };

  const buttonContent = getButtonContent();

  return (
    <button 
      className={buttonContent.className}
      onClick={buttonContent.onClick || handleVerifyClick}
      disabled={buttonContent.disabled}
    >
      {buttonContent.showCheckmark && (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="#1877F2"
          
          style={{ marginRight: '4px' }}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )}
      <span>{buttonContent.text}</span>
    </button>
  );
};

export default VerifyButton;
