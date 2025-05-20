import React from 'react';
import story4 from '../../assets/story4.png';
import './OurApproach.scss';


const OurApproach = () => { 

    return (
      <section className="story-section">
        <div className="story-content">
          <div className="story-image1">
            <img src={story4} alt="Elderly man and caregiver" />
          </div>
          <div className="story-text">
            <h2 className='title'>Our Approach</h2>
            <p>
              We aim to put you in control by making your healthcare experience seamless,
              convenient, and centered on your unique needs-from easy access to trusted
              professionals to ensuring your privacy at every step.<br></br>                                                                          
              We ensure that your health is at the forefront of every decision, 
              making it easier than ever to access the care you deserve
            </p>
          </div>
        </div>
      </section>
    );
};

export default OurApproach;