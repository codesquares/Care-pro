import React from 'react';
import '../../styles/components/header.scss'; 
import video from '../../assets/Video.png'
import arrow from '../../assets/arrow-right.svg'
import Button from '../atoms/Button'

const Header = () => {
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">Take care of yourself, & your loved ones</h1>
                <p className="header-subtitle">For as low as ₦10,000 get assigned a duly vetted caregiver in Lagos today.</p>
            </div>
            <div className="header-video">
                <img src={video} alt="Caregiver helping elderly" className="video-thumbnail" />
            </div>
            <div className="header-buttons">
                    <a href="/become-caregiver" className="btn-secondary">Book Caregiver</a>
                </div>
        </header>
    );
};

export default Header;
