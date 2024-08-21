import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/nav-bar.scss'; // Make sure to create this CSS file for styling

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src="/path/to/your/logo.png" alt="Carepro Logo" />
                </Link>
            </div>
            <div>
            <ul className="navbar-links">
                <li><Link to="/about-us">About us</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/care-facts">Care facts</Link></li>
                <li><Link to="/our-process">Our Process</Link></li>
                <li><Link to="/plans">Plans</Link></li>
            </ul>
            </div>

            <div className="navbar-cta">
                <Link to="/book-caregiver" className="btn-primary">
                    Book Caregiver <span className="calendar-icon">📅</span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
