import React from 'react';
import '../styles/components/general-banner.scss';
const GenaralBanner = ({
  title = 'Hire a Caregiver today!',
  description = 'As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home.',
  buttonText = 'Hire a Caregiver',
  imageUrl,
  onButtonClick,
  borderRadius = false,
  backgroundColor = '#f0f0f0',
}) => {
  return (
    <div className={`general-banner ${borderRadius ? 'border-radius' : ''}`}
    style={{ backgroundColor }} 
    >
      <div className="content">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={onButtonClick}>{buttonText}</button>
      </div>
      <div className="image-container">
        <img src={imageUrl} alt="Caregiver with client" />
      </div>
    </div>
  );
};

export default GenaralBanner;
