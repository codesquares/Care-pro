import React from 'react';
import '../../styles/components/story-section.scss';
import storyImage from '../../assets/storyImage.svg'

const StorySection = () => {
  return (
    <section className="story-section">
      <h2 className='main-title'>This is our story</h2>
      <div className="story-content">
        <div className="story-text">
          <h2 className='title'>On the quest to care for you anytime, anywhere. On the quest to care for you anytime.</h2>
          <p>
           We are here to serve you veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor
            Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolorUt enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor
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
