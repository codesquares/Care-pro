import React from 'react';
import "../styles/components/expert-team.scss";
import ifeoluwa from "../assets/ifeoluwa.jpeg"; // Placeholder for expert images
import faniyi from "../assets/faniyi.jpeg"; // Placeholder for expert images
import funmilola from "../assets/funmilola.jpeg"; // Placeholder for expert images
import victor from "../assets/victor.jpeg"; // Placeholder for expert images
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
          name: "Mrs. Oluwafunmilola", 
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
    
      <style jsx>{`
        .expert-team {
          padding: 20px;
          background-color: #f9f9f9; /* Light background for contrast */
        }

        .heading-section {
          text-align: center;
          margin-bottom: 20px;
        }

        .heading-section h2 {
          font-size: 2rem;
          font-weight: bold;
        }

        .philosophy {
          font-size: 1rem;
          color: #555; /* Darker text for readability */
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* Responsive grid */
          gap: 20px; /* Space between cards */
        }

        .team-card {
          position: relative; /* Position relative for absolute positioning of the name box */
          overflow: hidden; /* Hide overflow */
          height: 300px; /* Fixed height for the card */
          margin: 10px; /* Add margin to create space around the card */
          border-radius: 0; /* Ensure square corners */
        }

        .team-photo {
          width: 100%; /* Full width */
          height: 100%; /* Full height */
          object-fit: cover; /* Cover the entire card */
          display: block; /* Remove bottom space */
        }

        .name-box {
          position: absolute; /* Position the name box at the bottom */
          bottom: 10px; /* Align to the bottom with some space */
          left: 10px; /* Add space from the left border */
          right: 10px; /* Add space from the right border */
          background-color: white; /* White background for the name box */
          color: black; /* Black text color */
          text-align: left; /* Left align text */
          padding: 15px; /* Padding for the box */
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1); /* Optional shadow for the name box */
        }

        .name-box h3 {
          margin: 0; /* Remove default margin */
          font-size: 1.2rem; /* Increased font size for the name */
          font-weight: bold; /* Make the name bold */
        }

        .overlay {
          position: absolute; /* Position the overlay */
          top: 0; /* Align to the top */
          left: 0; /* Align to the left */
          right: 0; /* Align to the right */
          bottom: 0; /* Align to the bottom */
          background-color: rgba(0, 0, 0, 0.7); /* Black transparent background */
          display: flex; /* Flexbox for centering */
          justify-content: center; /* Center horizontally */
          align-items: center; /* Center vertically */
          opacity: 0; /* Initially hidden */
          transition: opacity 0.3s ease; /* Smooth transition for visibility */
        }

        .team-card:hover .overlay {
          opacity: 1; /* Show overlay on hover */
        }

        .social-links {
          display: flex; /* Flexbox for horizontal alignment */
          gap: 10px; /* Space between icons */
        }

        .social-links a {
          color: white; /* Icon color */
          font-size: 1.5rem; /* Size of the icons */
          transition: color 0.3s; /* Smooth transition for hover effect */
        }

        .social-links a:hover {
          color: #007bff; /* Change color on hover */
        }
      `}</style>
    </section>
  );
};

export default AbaoutUsTeam;