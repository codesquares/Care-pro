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

  // Don't show the button if verification is in progress
  if (verificationStatus === "in_progress") {
    return null;
  }

  // Handle different verification statuses
  const getButtonContent = () => {
    switch (verificationStatus) {
      case "verified":
        return {
          text: "Verified ✓",
          className: "verify-button verify-button-verified",
          showCheckmark: true,
          disabled: true,
        };
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
          text: "Get Verified",
          className: "verify-button",
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <button 
      className={buttonContent.className}
      onClick={buttonContent.disabled ? undefined : handleVerifyClick}
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
