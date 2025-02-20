import '../styles/components/top-banner.scss';
import storyImage from "../assets/storyImage.svg"
import React from 'react';


const AboutUsTopBanner = () => {
  const title = "Our Mission To Care";
 

  return (
    <div className="full-width-banner">
      <div className="banner-image-container">
        <img src={storyImage} alt="Elderly man and caregiver" className="banner-image" />
      </div>
      <div className="banner-content">
        <h1 className="banner-title">{title}</h1>
      </div>

      <style jsx>{`
        .full-width-banner {
          position: relative; /* Position relative for absolute positioning of content */
          width: 100%; /* Full width of the page */
          overflow: hidden; /* Hide overflow */
        }

        .banner-image-container {
          height: 55vh; /* Set height to 25% of the viewport height */
          overflow: hidden; /* Hide overflow */
        }

        .banner-image {
          width: 100%; /* Make the image take the full width */
          height: auto; /* Maintain aspect ratio */
          position: relative; /* Position relative for absolute positioning */
          top: -50%; /* Adjust this value to show the top part of the image */
        }

        .banner-content {
          position: absolute; /* Position content over the image */
          top: 50%; /* Center vertically */
          left: 50%; /* Center horizontally */
          transform: translate(-50%, -50%); /* Adjust for centering */
          color: white; /* Text color */
          text-align: center; /* Center text */
          padding: 20px; /* Padding around text */
        }

        .banner-title {
          font-size: 3rem; 
          color: white;
          margin: 0; /* Remove default margin */
        }

        .banner-description {
          font-size: 1rem; /* Adjust description size */
          margin: 10px 0; /* Margin for spacing */
        }

        .banner-button {
          background-color: #373732; /* Button background color */
          color: white; /* Button text color */
          border: none; /* Remove border */
          padding: 10px 20px; /* Button padding */
          border-radius: 5px; /* Rounded corners */
          cursor: pointer; /* Pointer cursor */
          transition: background-color 0.3s; /* Smooth transition */

          &:hover {
            background-color: #555; /* Darker background on hover */
          }
        }
      `}</style>
    </div>
  );
};

export default AboutUsTopBanner;

