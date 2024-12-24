
import '../../styles/components/healthcare-fact.scss';
import HeathIcon from '../../assets/HealthIcon.svg'

const HealthcareFacts = () => {
  const facts = [
    {
      text: "Post-surgical care significantly reduces readmission rates for patients with chronic conditions.",
      color: '#FDE7E7',
    },
    {
      text: "Quality sleep (7-9 hours) lowers the risk of illness, emphasising a serene environment.",
      color: '#D3E9FF',
    },
    {
      text: "Chronic stress increases cortisol, leading to weight gain and unhealthy cravings.",
      color: '#E6E3FF',
    },
    {
      text: "Mentally stimulating activities can reduce risk of  dementia in older adults.",
      color: '#FDE7E7',
    },
  ];

  return (
    <div className="healthcare-facts">
      <div className="header-container">
        <div className="icon">
          <img src={HeathIcon} alt="Healthcare Icon" />
        </div>
        <h2>Healthcare facts:</h2>
      </div>
      <div className="facts-list">
        {facts.map((fact, index) => (
          <div key={index} className="fact-item" style={{ backgroundColor: fact.color }}>
            <p>{fact.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthcareFacts;
