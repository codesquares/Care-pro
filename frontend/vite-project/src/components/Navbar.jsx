import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/careproLogo.svg';
import arrow from '../assets/arrow-right.svg';
import hambugerImg from '../assets/ci_hamburger-md.svg';
import '../styles/components/nav-bar.scss';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Function to close the menu when a link is clicked
    const handleLinkClick = () => {
        setIsMenuOpen(false); // Close menu after clicking a link
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src={logo} alt="Carepro Logo" />
                </Link>
            </div>

            <button className="navbar-toggle" onClick={toggleMenu}>
                <img src={hambugerImg} alt='Hamburger' />
            </button>

            <ul ref={menuRef} className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                <li>
                    <Link to="/our-process" onClick={handleLinkClick}>
                        Hire Caregiver
                    </Link>
                </li>
                <li>
                    <Link to="/plans" onClick={handleLinkClick}>
                        Become a caregiver
                    </Link>
                </li>
                <li>
                    <Link to="/about-us" onClick={handleLinkClick}>
                        About us
                    </Link>
                </li>
                <li>
                    <Link to="/blog" onClick={handleLinkClick}>
                        Blog
                    </Link>
                </li>
            </ul>

            <div className="navbar-cta">
                <Link to="/book-caregiver" className="btn-primary">
                    Join the waitlist <span className="calendar-icon"><img src={arrow} alt="arrow-right" /></span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
