import "../../styles/components/client-hiring-process.css";
import caregiverImg from "../../assets/nurseAndWoman.png";
import ep_select from "../../assets/ep_select.svg";
import bi_stars from "../../assets/bi_stars.svg";
import clarity from "../../assets/clarity_talk-bubbles-line.svg";
import tdesign from "../../assets/tdesign_money.svg";
import arrow from "../../assets/arrow-right.svg";
import { useAuth } from "../../main-app/context/AuthContext";
import { useNavigate } from "react-router-dom";

const ClientHiringProcess = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      icon: ep_select,
      title: "Browse & Choose a Caregiver",
      description:
        "Explore our marketplace of verified care professionals. Filter by category, location, ratings, and experience to find the right match for your needs.",
    },
    {
      icon: tdesign,
      title: "Pay a Commitment Fee",
      description:
        "Once you find a caregiver, pay a small non-refundable commitment fee to initiate contact. This fee is deducted from your total balance when the full gig is paid for.",
    },
    {
      icon: clarity,
      title: "Connect & Agree on Terms",
      description:
        "Chat directly with your chosen caregiver to discuss care requirements, schedule, and pricing. Once you both agree, a formal contract is generated on the platform.",
    },
    {
      icon: bi_stars,
      title: "Receive Quality Care & Pay",
      description:
        "Your caregiver delivers the agreed-upon service. Confirm completion and release payment securely through the platform. If no contract is reached, you only lose the commitment fee.",
    },
  ];

  const handleButtonClick = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === "client") {
      navigate("/app/client/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="client-hiring-process">
      <div className="head-section">
        <h2>How Hiring Works</h2>
        <p className="subtitle">
          Find and hire a trusted caregiver in 4 simple steps
        </p>
      </div>
      <div className="main-section">
        <div className="steps-list">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="icon">
                <img src={step.icon} alt={step.title} />
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
          <button className="hire-button" onClick={handleButtonClick}>
            Hire a Caregiver
            <img src={arrow} alt="arrow" />
          </button>
        </div>
        <div className="image-section">
          <img src={caregiverImg} alt="Client with caregiver" />
        </div>
      </div>

      <div className="commitment-fee-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <h4>About the Commitment Fee</h4>
          <p>
            The commitment fee is non-refundable but is <strong>deducted from your total balance</strong> when you pay for the full gig. If you and the caregiver cannot reach an agreement and no contract is generated, you only lose the commitment fee — no further charges apply.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientHiringProcess;
