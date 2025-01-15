import React from "react";
import "./gigs-section.css";

const gigs = [
  {
    id: 1,
    image: "https://via.placeholder.com/150",
    title: "I will clean your house and do laundry",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/150",
    title: "Training and taking care of your pets",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/150",
    title: "Support and companionship for elders",
  },
];

const GigsSection = () => (
  <div className="gigs-section">
    <h3>Active Gigs</h3>
    <div className="gigs-grid">
      {gigs.map((gig) => (
        <div key={gig.id} className="gig-card">
          <img src={gig.image} alt={gig.title} className="gig-image" />
          <h4 className="gig-title">{gig.title}</h4>
        </div>
      ))}
      <div className="gig-card create-new">
        <div className="create-icon">+</div>
        <p>Create a new Gig</p>
      </div>
    </div>
  </div>
);

export default GigsSection;
