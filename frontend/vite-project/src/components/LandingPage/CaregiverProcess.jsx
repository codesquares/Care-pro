import "../../styles/components/caregiver-process.scss";
import caregiverImg from "../../assets/grandimg.png";
import tdesign from "../../assets/tdesign_money.svg";
import solar from "../../assets/solar_health-broken.svg";
import ep_select from "../../assets/ep_select.svg";
import bi_stars from "../../assets/bi_stars.svg";
import clarity from "../../assets/clarity_talk-bubbles-line.svg";
const CaregiverProcess = ({buttonText="Hire a Caregiver", btnBgColor="#373732", title= 'How CarePro Works'}) => {
  const steps = [
    { icon: ep_select  , text: "Select a Package: Choose the luxury care package that suits your needs." },
    { icon:  bi_stars , text: "Answer Some Basic Questions: Provide essential details to help us understand your preferences and requirements." },
    { icon:  tdesign , text: "Get Caregiver Match Suggestions: Receive personalized caregiver matches based on your unique needs." },
    { icon: clarity, text: "Payment: Secure your premium care experience with a seamless payment process." },
    { icon: solar , text: "Interview Matched Caregivers: Meet with your matched caregivers to ensure the perfect fit."},
    { icon: solar , text: "Hire and Get Your Care Plan: Finalize your choice, and receive a customized care plan tailored to your comfort and well-being."},
  ];

  return (
    <div className="caregiver-process">
      <div className="head-section">
        <h2>{title}</h2>
        <p className="subtitle">
        6 Steps to an Unforgettable Carepro Experience:
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
              {buttonText}
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
