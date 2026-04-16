import React from 'react';
import './IntroSection.css';

const IntroSection = () => {
  return (
    <section className="about-intro">
      <div className="intro-container">
        <h2>
          CarePro is connecting individuals & care representatives with{" "}
          <span className="highlight">trusted, vetted, & verified</span> caregivers 
          across medical and non-medical home care categories.
        </h2>
        <p>
          We have reimagined how home care is accessed, making it easier, simpler, more 
          accessible, & centered around the real needs of individuals and families.
        </p>
      </div>
      <div className="decorative-star">✦</div>
    </section>
  );
};

export default IntroSection;
