import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./assessment-button.css";
import assessmentService from "../../../services/assessmentService";
import ProfileCard from "../care-giver-dashboard/ProfileCard";

/**
 * A button component that redirects caregivers to the assessment page or shows qualification status
 * This button should be shown once the caregiver is verified
 */
const AssessmentButton = ({ verificationStatus }) => {
  const navigate = useNavigate();
  const [qualificationStatus, setQualificationStatus] = useState(null);

  // Get qualification status on initial render
  useEffect(() => {
    const status = assessmentService.getQualificationStatus();
    setQualificationStatus(status);
  }, []);

  // Redirect to assessment page when clicked
  const handleAssessmentClick = () => {
    navigate("/app/caregiver/assessment");
  };

  // Only show the button if user is verified
  if (verificationStatus !== "verified") {
    return null;
  }

  // If we haven't loaded the qualification status yet
  if (!qualificationStatus) {
    return (
      <button className="assessment-button loading">
        <i className="fas fa-spinner fa-spin"></i> Loading...
      </button>
    );
  }

  // If user is qualified, show qualified status
  if (qualificationStatus.isQualified) {
    return (
      <button className="assessment-button qualified" disabled>
        <i className="fas fa-check-circle"></i> Qualified Caregiver
      </button>
    );
  }

  // If user has completed assessment but failed and cannot retake yet
  if (qualificationStatus.assessmentCompleted && !qualificationStatus.canRetake) {
    // Calculate remaining days
    const retakeDate = new Date(qualificationStatus.canRetakeAfter);
    const now = new Date();
    const daysRemaining = Math.ceil((retakeDate - now) / (1000 * 60 * 60 * 24));
    
    return (
      <button className="assessment-button retry-pending" disabled>
        <i className="fas fa-hourglass-half"></i> Retake Available in {daysRemaining} Days
      </button>
    );
  }

  // If user has failed assessment but can retake
  if (qualificationStatus.assessmentCompleted && qualificationStatus.canRetake) {
    return (
      <button className="assessment-button retry" onClick={handleAssessmentClick}>
        <i className="fas fa-redo"></i> Retake Assessment
      </button>
    );
  }

  // Default case: User can take assessment
  return (
    <button className="assessment-button" onClick={handleAssessmentClick}>
      Take Caregiver Assessment
    </button>
  );
};

export default AssessmentButton;
