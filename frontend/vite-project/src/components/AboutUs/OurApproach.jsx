import React from 'react';
import { Link } from 'react-router-dom';
import groupImg from '../../assets/about-us/approach_group.png';
import './OurApproach.css';

const OurApproach = () => { 
    return (
      <section className="about-approach-section">
        <div className="approach-container">
          <div className="approach-text">
            <h2>Our Approach</h2>
            <p>
              Our approach combines compassion with disciplined to ensure that trust, 
              clarity, & accountability are embedded into every layer of the users' 
              experience. We do not treat home care as a listing problem. We treat 
              it as a trust infrastructure challenge.
            </p>
            <p>
              CarePro is guided by people who understand both the emotional weight 
              of care and the operational discipline required to structure it responsibly.
            </p>
            <Link to="/team" className="meet-team-btn">Meet Our Team</Link>
          </div>
          <div className="approach-image">
            <img src={groupImg} alt="CarePro Approach Group" />
          </div>
        </div>
      </section>
    );
};

export default OurApproach;