import React from 'react';
import story4 from '../../assets/story4.png'


const OurApproach = () => { 



    return (
      <section className="story-section">
        <style jsx>{`
          .story-section {
            padding: 20px; /* Adjust padding as needed */
          }
  
          .story-content {
            display: flex; /* Use flexbox for layout */
            align-items: center; /* Center items vertically */
          }
  
          .story-text {
            flex: 2; /* Allow the text to take up more space */
            margin-left: 20px; /* Space between image and text */
          }
  
          .story-image1 {
            flex: 2; /* Allow the image to take up space */
          }
  
          .story-image1 img {
            max-width: 100%; /* Ensure the image is responsive */
            height: auto; /* Maintain aspect ratio */
          }

        `}</style>
        
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