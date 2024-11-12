import React from 'react';
import '../styles/components/general-banner.scss';
const GenaralBanner = ({
  title = 'Hire a Caregiver today!',
  description = 'As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home.',
  buttonText = 'Hire a Caregiver',
  imageUrl,
  onButtonClick,
  backgroundColor = '#f0f0f0',
}) => {
  return (
    <div className={`general-banner`}
    style={{ backgroundColor }} 
    >
      <div className="general-banner-content">
        <h1>{title}</h1>
        <p>{description}</p>
        <button onClick={onButtonClick}>{buttonText}</button>
      </div>
      <div className="image-content">
        <img src={imageUrl} alt="Caregiver with client" />
      </div>
    </div>
  );
};

export default GenaralBanner;
