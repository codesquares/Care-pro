import "../../styles/components/caregiver-process.scss";
import caregiverImg from "../../assets/careGiver.png";
import tdesign from "../../assets/tdesign_money.svg";
import solar from "../../assets/solar_health-broken.svg";
import ep_select from "../../assets/ep_select.svg";
import bi_stars from "../../assets/bi_stars.svg";
import clarity from "../../assets/clarity_talk-bubbles-line.svg";
const CaregiverProcess = () => {
  const steps = [
    { icon: ep_select  , text: "Select a Care package" },
    { icon:  bi_stars , text: "Receive suggestions" },
    { icon:  tdesign , text: "Make payment" },
    { icon: clarity, text: "Interview suggested caregivers" },
    { icon: solar , text: "Select preferred caregiver" },
  ];

  return (
    <div className="caregiver-process">
      <div className="head-section">
        <h2>Process to get a Caregiver</h2>
        <p className="subtitle">
          In 5 simple steps pick a care package and get caregiver
          recommendations based on your unique needs
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
        </div>
        <div className="image-section">
          <img src={caregiverImg} alt="Caregiver and Elderly Woman" />
        </div>
      </div>
    </div>
  );
};

export default CaregiverProcess;
