import React from "react";
import { useNavigate } from "react-router-dom";
import "./verify-button.css";

/**
 * A button component that redirects caregivers to the verification page
 * This button should only be shown if the caregiver is not yet verified
 */
const VerifyButton = ({ verificationStatus }) => {
  const navigate = useNavigate();

  // Redirect to verification page when clicked
  const handleVerifyClick = () => {
    navigate("/app/caregiver/verification");
  };

  // Don't show the button if user is already verified or verification is in progress
  if (verificationStatus === "verified" || verificationStatus === "in_progress") {
    return null;
  }

  // Handle different verification statuses
  const getButtonContent = () => {
    switch (verificationStatus) {
      case "failed":
        return {
          text: "Retry Verification",
          className: "verify-button verify-button-retry",
        };
      case "pending":
        return {
          text: "Verification Pending",
          className: "verify-button verify-button-pending",
          disabled: true,
        };
      default:
        return {
          text: "Verify Account",
          className: "verify-button",
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <button 
      className={buttonContent.className} 
      onClick={handleVerifyClick}
      disabled={buttonContent.disabled}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: buttonContent.disabled ? '#6c757d' : 
          (verificationStatus === 'failed' ? '#dc3545' : '#007bff'),
        color: 'white',
        cursor: buttonContent.disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '150px',
        height: '36px',
        width: '150px'
      }}
    >
      {buttonContent.text}
    </button>
  );
};

export default VerifyButton;
