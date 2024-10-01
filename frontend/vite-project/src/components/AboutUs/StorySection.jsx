import React from 'react';
import '../../styles/components/story-section.scss';
import storyImage from '../../assets/storyImage.svg'

const StorySection = () => {
  return (
    <section className="story-section">
      <h2 className='main-title'>Our mission to care</h2>
      <div className="story-content">
        <div className="story-text">
          <h2 className='title'>Dignified Care that puts your Health, Privacy and Comfort first.</h2>
          <p>
          Carepro is on a mission to change the narrative in healthcare using a personalised approach that prioritises health, comfort and privacy. 
          Therefore, we redesigned the healthcare experience to create an environment where every individual is not just another statistic but valued and understood.
          </p>
        </div>
        <div className="story-image">
          <img src={storyImage} alt="Elderly man and caregiver" />
        </div>
      </div>
    </section>
  );
};

export default StorySection;
