import React from 'react';
import '../../styles/components/story-section.scss';
import nurseAndWomen from '../../assets/nurseAndWoman.png'

const StorySection = () => {
  return (
    <section className="story-section">
      <br></br><br></br><br></br>
      <div className="story-content">
        <div className="story-text">
          <h2 className='title'>Our Mission: <br></br>To put quality healthcare into your own hands  </h2>
          <p>
          Carepro is on a mission to transform the healthcare experience by prioritise and empowering you to take charge
          of youe health and well-being. we have redesigned healthcare to make it simpler, 
          more accessable, and entirely focused on you, providing healthcare that fits seamleslly into your life.
          </p>
        </div>
        <div className="story-image">
          <img src={nurseAndWomen} alt="Elderly man and caregiver" />
        </div>
      </div>
    </section>
  );
};

export default StorySection;
