import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/careproLogo.svg'
import hambugerImg from '../assets/ci_hamburger-md.svg'
import '../styles/components/nav-bar.scss'; // Ensure this SCSS file contains your styles

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src={logo} alt="Carepro Logo" />
                </Link>
            </div>

            <button className="navbar-toggle" onClick={toggleMenu}>
                <img src={hambugerImg} alt='Hambuger'/>
            </button>

            <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                <li><Link to="/our-process">Our Process</Link></li>
                <li><Link to="/plans">Plans</Link></li>
                <li><Link to="/about-us">About us</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                {/* <li><Link to="/care-facts">Care facts</Link></li> */}
            </ul>

            <div className="navbar-cta">
                <Link to="/book-caregiver" className="btn-primary">
                    Book Caregiver <span className="calendar-icon">📅</span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
