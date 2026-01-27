import "./expert-team.css";
import ifeoluwa from "../../assets/ifeoluwa.jpeg"; // Placeholder for expert images
import faniyi from "../../assets/faniyi.jpeg"; // Placeholder for expert images
import funmilola from "../../assets/lolaidowu2.jpg"; // Placeholder for expert images
import victor from "../../assets/victor.jpeg"; // Placeholder for expert images
// Placeholder for expert images



const ExpertTeam = () => {
  const experts = [
    { name: "Ifeoluwa Adelokun", role: "Chief Finance Officer", discription: "4+ of experience in finance, specializing in export sectors.", imgSrc: ifeoluwa },
    { name: "Micheal Faniyi", role: "Director of Research & Strategy", discription: "Expert in data analysis, and GIS, with a focus on strategy.", imgSrc: faniyi },
    { name: "Gwatana Victor", role: "Director of creativity & Brand", discription: "8 years of expertise in brand development and design.", imgSrc: victor },
    { name: "Lola Idowu ", role: "Director of Home Care", discription: "Over five years of expertise in disability and geriatric care.", imgSrc: funmilola },
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
              <p>{expert.discription}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpertTeam;
