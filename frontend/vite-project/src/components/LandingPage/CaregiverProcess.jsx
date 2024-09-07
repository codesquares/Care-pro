import "../../styles/components/caregiver-process.scss";
import caregiverImg from "../../assets/careGiver.png";
const CaregiverProcess = () => {
  const steps = [
    { icon: "✓", text: "Select a Care package" },
    { icon: "➕", text: "Receive suggestions" },
    { icon: "💳", text: "Make payment" },
    { icon: "👥", text: "Interview suggested caregivers" },
    { icon: "❤️", text: "Select preferred caregiver" },
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
              <div className="icon">{step.icon}</div>
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
