import "../styles/components/expert-team.scss";
import expertplaceholder from "../assets/expert-placeholder.jpg"


const AboutUsTeam = () => {
  const experts = [
    {  name: "plaveholder1", imgSrc: expertplaceholder },
    {  name: "plaveholder2", imgSrc: expertplaceholder },
    {  name: "plaveholder3", imgSrc: expertplaceholder },
    {  name: "plaveholder4", imgSrc: expertplaceholder },
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
          </div>
        ))}
      </div>
    </section>
  );
};

export default AboutUsTeam;
