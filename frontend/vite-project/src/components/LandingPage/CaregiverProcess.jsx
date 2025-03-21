import "../../styles/components/caregiver-process.scss";
import caregiverImg from "../../assets/grandimg.png";
import tdesign from "../../assets/tdesign_money.svg";
import solar from "../../assets/solar_health-broken.svg";
import ep_select from "../../assets/ep_select.svg";
import bi_stars from "../../assets/bi_stars.svg";
import clarity from "../../assets/clarity_talk-bubbles-line.svg";
import arrow from "../../assets/arrow-right.svg";
const CaregiverProcess = ({buttonText="Hire a Caregiver", btnBgColor="#373732", title= 'How CarePro Works'}) => {
  const steps = [
    { icon: ep_select  , text: "Sign up and get verified: Provide details needed to vet you and get verified by the team." },
    { icon:  bi_stars , text: "Create a gig: Create a gig which will be made visible to profiles on the platform." },
    { icon:  clarity , text: "Get selected to give care: Get notified and speak with recipient on the platform when you recieve an order." },
    { icon: tdesign, text: "Recieve Payment Get paid after confirmation of payment from recipient of service" },
    
  ];

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
              <div className="icon"><img src={step.icon} alt={step.text} /></div>
              <div className="text">{step.text}</div>
            </div>
          ))}
          <button className="hire-button"
            style={{ backgroundColor: btnBgColor }}>
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
