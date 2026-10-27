import { useNavigate } from "react-router-dom";
import "./vetting-link-card.css";

const VettingLinkCard = () => {
  const navigate = useNavigate();

  return (
    <div className="vlc-card">
      <div className="vlc-text">
        <h3 className="vlc-title">Complete Your Vetting</h3>
        <p className="vlc-description">
          Add your caregiver classification, guarantors and address history so clients can trust your profile.
        </p>
      </div>
      <button
        type="button"
        className="vlc-button"
        onClick={() => navigate("/app/caregiver/vetting")}
      >
        Go to Vetting
      </button>
    </div>
  );
};

export default VettingLinkCard;
