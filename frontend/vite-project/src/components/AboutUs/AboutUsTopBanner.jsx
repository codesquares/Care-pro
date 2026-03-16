import React from 'react';
import './AboutUs-Banner.css';
import heroImg from '../../assets/about-us/hero.png';

const AboutUsTopBanner = () => {
  return (
    <div className="about-hero">
      <div className="hero-image-overlay">
        <img src={heroImg} alt="CarePro Hero" className="hero-img" />
      </div>
      <div className="hero-content">
        <p className="subtitle">Our Vision</p>
        <h1>A world where trusted home care<br />is easier to find.</h1>
      </div>
    </div>
  );
};

export default AboutUsTopBanner;
