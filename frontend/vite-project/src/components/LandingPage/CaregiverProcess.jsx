import "../../styles/components/caregiver-process.css";
import caregiverImg from "../../assets/grandimg.png";
import tdesign from "../../assets/tdesign_money.svg";
import solar from "../../assets/solar_health-broken.svg";
import ep_select from "../../assets/ep_select.svg";
import bi_stars from "../../assets/bi_stars.svg";
import clarity from "../../assets/clarity_talk-bubbles-line.svg";
import arrow from "../../assets/arrow-right.svg";
import { useAuth } from "../../main-app/context/AuthContext";
import { useNavigate } from "react-router-dom";
const CaregiverProcess = ({buttonText="Hire a Caregiver", btnBgColor="#373732", title= 'How CarePro Works'}) => {
  const { isAuthenticated, user, handleLogout } = useAuth();
  const navigate = useNavigate();
  
  // Don't render if user is authenticated and is a caregiver
  if (isAuthenticated && user?.role?.toLowerCase() === 'caregiver') {
    return null;
  }
  
  const steps = [
    { icon: ep_select, title: "Sign Up & Get Verified", description: "Create your account and provide the details needed to verify your identity and qualifications. Our team reviews every application to ensure trust and safety." },
    { icon: bi_stars, title: "Create Your Service Gig", description: "Set up your care service listing with your skills, experience, availability, and rates. Your gig will be visible to clients searching the marketplace." },
    { icon: clarity, title: "Get Selected & Connect", description: "When a client selects you, you'll be notified instantly. Chat directly with them on the platform to discuss care needs and schedule details." },
    { icon: tdesign, title: "Deliver Care & Get Paid", description: "Provide quality care to your client. Once the service is confirmed as complete, payment is securely released to you through the platform." },
  ];
  
  const handleButtonClick = async () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      // Log out client and redirect to register
      await handleLogout();
      navigate('/register');
    } else {
      // Default behavior for non-authenticated users
      navigate('/register');
    }
  };

  return (
    <div className="caregiver-process">
      <div className="head-section">
        <h2>{title}</h2>
        <p className="subtitle">
        Build a rewarding career in 4 easy steps
        </p>
      </div>
      <div className="main-section">
        <div className="steps-list">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="icon"><img src={step.icon} alt={step.title} /></div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
          <button className="hire-button"
            style={{ backgroundColor: btnBgColor }}
            onClick={handleButtonClick}>
              {buttonText}<img src={arrow} alt="arrow" />
          </button>
        </div>
        <div className="image-section">
          <img src={caregiverImg} alt="Caregiver and Elderly Woman" />
        </div>
      </div>
    </div>
  );
};

export default CaregiverProcess;
