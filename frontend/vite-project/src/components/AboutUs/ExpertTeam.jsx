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
        <h2>Meet our amazing team of experts</h2>
        <p className="philosophy">
          Our philosophy is: hire great people and give them the resources and
          support to give the best service.
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
