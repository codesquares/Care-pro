import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./assessment-button.css";
import assessmentService from "../../../services/assessmentService";
import ProfileCard from "../care-giver-dashboard/ProfileCard";

/**
 * A button component that redirects caregivers to the assessment page or shows qualification status
 * This button should be shown once the caregiver is verified
 */
const AssessmentButton = ({ verificationStatus, userId }) => {
  const navigate = useNavigate();
  const [qualificationStatus, setQualificationStatus] = useState(null);

  // Get qualification status on initial render
  useEffect(() => {
    const fetchQualificationStatus = async () => {
      if (userId) {
        const status = await assessmentService.getQualificationStatus(userId);
        setQualificationStatus(status);
      }
    };
    fetchQualificationStatus();
  }, [userId]);
console.log("AssessmentButton render - userId:", userId, "verificationStatus:", verificationStatus, "qualificationStatus:", qualificationStatus?.isQualified);
  // Redirect to assessment page when clicked
  const handleAssessmentClick = () => {
    navigate("/app/caregiver/assessment");
  };

  // Only show the button if user is verified/completed
  if (verificationStatus !== "verified" && verificationStatus !== "completed") {
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
  if (qualificationStatus.isQualified === true) {
    return (
      <button className="assessment-button qualified" disabled>
        <i className="fas fa-check-circle"></i> Qualified Caregiver (Score: {qualificationStatus.score})
      </button>
    );
  }
 
  // If user has completed assessment but failed (score < 70)
  if (qualificationStatus.assessmentCompleted === true && qualificationStatus.isQualified === false) {
    return (
      <button className="assessment-button retry" onClick={handleAssessmentClick}>
        <i className="fas fa-redo"></i> Retake Assessment (Score: {qualificationStatus.score})
      </button>
    );
  }

  // If there was an error fetching status
  if (qualificationStatus.error) {
    return (
      <button className="assessment-button error" onClick={handleAssessmentClick}>
        <i className="fas fa-exclamation-triangle"></i> Take Assessment (Error loading status)
      </button>
    );
  }

  // Default case: User hasn't taken assessment yet
  if (qualificationStatus.assessmentCompleted === false) {
    return (
      <button className="assessment-button" onClick={handleAssessmentClick}>
        Take Caregiver Assessment
      </button>
    );
  }

  // Fallback - shouldn't reach here
  return (
    <button className="assessment-button loading">
      <i className="fas fa-spinner fa-spin"></i> Loading...
    </button>
  );
};

export default AssessmentButton;
