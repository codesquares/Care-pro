import React from 'react';
import { useNavigate } from "react-router-dom";
import "./BottomBanner.css";
import ctabannerImg from '../../assets/ctabanner.png';

const BottomBanner = () => {
    const navigate = useNavigate();
    
    return (
      <div className='about-cta-container'> 
        <div className='about-cta-banner' style={{ backgroundImage: `url(${ctabannerImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className='cta-content'>
            <h2>Looking for the perfect care professional or are you a care professional looking for work?</h2>
            <p>Over 300+ care professionals are waiting for you.</p>
            <div className='cta-buttons'>
              <button className='btn-primary' onClick={() => navigate('/book-caregiver')}>
                Hire a Caregiver
              </button>
              <button className='btn-secondary' onClick={() => navigate('/become-caregiver')}>
                Become a Caregiver
              </button>
            </div>
          </div>
          {/* Decorative arc/gradient background handled in CSS */}
        </div>
      </div>
    );
  };
  
  export default BottomBanner;