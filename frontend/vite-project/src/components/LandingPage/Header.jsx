import React from 'react';
import '../../styles/components/header.scss'; 
import video from '../../assets/Video.png'
import Button from '../atoms/Button'

const Header = () => {
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">Take care of yourself, & your loved ones</h1>
                <p className="header-subtitle">For as low as ₦10,000 get assigned a duly vetted caregiver in Lagos today.</p>
                <div className="header-buttons">
                    <a href="/book-caregiver" className="btn-main">Book Caregiver</a>
                    <a href="/become-caregiver" className="btn-secondary">Become a Caregiver</a>
                </div>
            </div>
            <div className="header-video">
                <img src={video} alt="Caregiver helping elderly" className="video-thumbnail" />
            </div>
        </header>
    );
};

export default Header;
