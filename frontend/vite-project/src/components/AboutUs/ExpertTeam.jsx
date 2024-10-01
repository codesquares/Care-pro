import "../../styles/components/expert-team.scss";
import expertImg from "../../assets/expert-placeholder.jpg"; // Placeholder for expert images


const ExpertTeam = () => {
  const experts = [
    { name: "James Gordon", role: "Research specialist", imgSrc: expertImg },
    { name: "James Gordon", role: "Research specialist", imgSrc: expertImg },
    { name: "James Gordon", role: "Research specialist", imgSrc: expertImg },
    { name: "James Gordon", role: "Research specialist", imgSrc: expertImg },
  ];

  return (
    <section className="expert-team">
      <div className="heading-section">
        <h2>The brains behind Carepro</h2>
        <p className="philosophy">
        Your Trusted Partners, providing all you need for a better healthcare experience.
        </p>
      </div>
      <div className="team-grid">
        {experts.map((expert, index) => (
          <div key={index} className="team-card">
            <img src={expert.imgSrc} alt={expert.name} className="team-photo" />
            <div className="team-info">
              <h3>{expert.name}</h3>
              <p>{expert.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpertTeam;
