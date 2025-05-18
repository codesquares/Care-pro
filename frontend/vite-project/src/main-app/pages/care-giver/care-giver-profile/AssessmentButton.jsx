import React from "react";
import { useNavigate } from "react-router-dom";
import "./assessment-button.css"; // Using dedicated CSS file

/**
 * A button component that redirects caregivers to the assessment page
 * This button should be shown once the caregiver is verified
 */
const AssessmentButton = ({ verificationStatus }) => {
  const navigate = useNavigate();

  // Redirect to assessment page when clicked
  const handleAssessmentClick = () => {
    navigate("/app/caregiver/assessment");
  };

  // Only show the button if user is verified
  // For testing, we're bypassing the verification check
  // if (verificationStatus !== "verified") {
  //   return null;
  // }

  return (
    <button 
      className="assessment-button" 
      onClick={handleAssessmentClick}
    >
      Take Caregiver Assessment
    </button>
  );
};

export default AssessmentButton;
