import React from 'react';
import './HumanExperience.css';
import expImg from '../../assets/about-us/human_experience.png';

const HumanExperience = () => {
  return (
    <section className="human-exp-section">
      <div className="human-exp-container">
        <div className="exp-image">
          <img src={expImg} alt="Assisting senior" />
        </div>
        <div className="exp-text">
          <h2>Transforming home care into a simpler, more human experience.</h2>
          <p>
            <strong>Care is personal.</strong> It affects families, dignity, recovery, 
            independence, and peace of mind. CarePro is on a mission to transform the 
            home care experience by prioritizing people and empowering them to take charge 
            of their care decisions. We believe access to trusted care should not be 
            complicated, uncertain, or overwhelming.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HumanExperience;
