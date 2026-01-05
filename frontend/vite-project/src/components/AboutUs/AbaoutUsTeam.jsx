
import "./expert-team.css";
import '../../styles/components/AboutUsTeam.css';
import ifeoluwa from "../../assets/ifeoluwa.jpeg"; // Placeholder for expert images
import faniyi from "../../assets/faniyi.jpeg"; // Placeholder for expert images
import funmilola from "../../assets/lolaidowu2.jpg"; // Placeholder for expert images
import victor from "../../assets/victor.jpeg"; // Placeholder for expert images
import { FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa'; // Import social media icons

const AbaoutUsTeam = () => {
    const experts = [
        { 
          name: "Ifeoluwa Adelokun", 
          role: "Chief Finance Officer", 
          imgSrc: ifeoluwa,
          socialLinks: {
            instagram: "https://instagram.com",
            linkedin: "https://linkedin.com",
            twitter: "https://twitter.com"
          }
        },
        { 
          name: "Micheal Faniyi", 
          role: "Director of Research & Strategy", 
          imgSrc: faniyi,
          socialLinks: {
            instagram: "https://instagram.com",
            linkedin: "https://linkedin.com",
            twitter: "https://twitter.com"
          }
        },
        { 
          name: "Gwatana Victor", 
          role: "Director of Creativity & Brand", 
          imgSrc: victor,
          socialLinks: {
            instagram: "https://instagram.com",
            linkedin: "https://linkedin.com",
            twitter: "https://twitter.com"
          }
        },
        { 
          name: "Lola Idowu", 
          role: "Director of Home Care", 
          imgSrc: funmilola,
          socialLinks: {
            instagram: "https://instagram.com",
            linkedin: "https://linkedin.com",
            twitter: "https://twitter.com"
          }
        },
      ];
  return (
        <section className="expert-team">
          <div className="heading-section">
            <h2>The Brains Behind Carepro</h2>
            <p className="philosophy">
              Your Trusted Partners, providing all you need for a better healthcare experience.
            </p>
          </div>
          <div className="team-grid">
            {experts.map((expert, index) => (
              <div key={index} className="team-card">
                <img src={expert.imgSrc} alt={expert.name} className="team-photo" />
                <div className="name-box">
                  <h3>{expert.name}</h3>
                </div>
                <div className="overlay">
                  <div className="social-links">
                    <a href={expert.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <FaInstagram />
                    </a>
                    <a href={expert.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaLinkedin />
                    </a>
                    <a href={expert.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <FaTwitter />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
    </section>
  );
};

export default AbaoutUsTeam;