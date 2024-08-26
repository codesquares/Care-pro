
import '../../styles/components/healthcare-fact.scss';

const HealthcareFacts = () => {
  const facts = [
    {
      text: "Mental health disorders are among the leading causes of disability worldwide",
      color: '#FDE7E7',
    },
    {
      text: "Approximately half of the world's population still lacks access to essential health services.",
      color: '#D3E9FF',
    },
    {
      text: "Mental health disorders are among the leading causes of disability worldwide",
      color: '#E6E3FF',
    },
    {
      text: "Mental health disorders are among the leading causes of disability worldwide",
      color: '#FDE7E7',
    },
  ];

  return (
    <div className="healthcare-facts">
      <div className="header-container">
        <div className="icon">
          <span role="img" aria-label="Healthcare Icon">🛡️</span>
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
