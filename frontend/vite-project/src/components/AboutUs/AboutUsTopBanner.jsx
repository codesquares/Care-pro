import React from 'react';
import storyImage from "../../assets/storyImage.svg"
import '../../styles/components/AboutUs-Banner.scss';


const AboutUsTopBanner = () => {
  const title = "Our Mission To Care";

  return (
    <div className="full-width-banner">
      <div className="banner-image-container">
        <img src={storyImage} alt="Elderly man and caregiver" className="banner-image" />
      </div>
      <div className="banner-content">
        <h1 className="banner-title" >{title}</h1>
      </div>
    </div>
  );
};

export default AboutUsTopBanner;

