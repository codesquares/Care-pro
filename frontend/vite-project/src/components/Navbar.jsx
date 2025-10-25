import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/careproLogo.svg';
import arrow from '../assets/arrow-right.svg';
import hambugerImg from '../assets/ci_hamburger-md.svg';
import messageIcon from '../assets/message_icon.png';
import '../styles/components/nav-bar.scss';
import { useAuth } from '../main-app/context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const { isAuthenticated, user, handleLogout } = useAuth();

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

    // Function to navigate to the appropriate messages page based on user role
    const handleMessageClick = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/messages' } });
            return;
        }

        // Check if user details exist to prevent API calls with invalid user data
        if (!user) {
            console.error('User details missing but logged in state is true');
            navigate('/login', { state: { from: '/messages' } });
            return;
        }

        try {
            // Pre-validate user data to prevent issues
            if (!user.id) {
                throw new Error('User ID missing');
            }
            
            // Navigate to appropriate route based on user role
            if (user.role === 'Caregiver') {
                navigate('/app/caregiver/message');
            } else {
                navigate('/app/client/message');
            }
        } catch (error) {
            console.error('Error processing user data:', error);
            // Handle invalid user data gracefully
            handleLogout();
            navigate('/login', { state: { from: '/messages', error: 'Session data corrupted. Please login again.' } });
        }
    };

    // Handle the CTA button click
    const handleCtaClick = () => {
        if (isAuthenticated) {
            handleLogout();
        } else {
            navigate('/register');
        }
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
                    <Link to="/book-caregiver" onClick={handleLinkClick}>
                        Hire Caregiver
                    </Link>
                </li>
                <li>
                    <Link to="/become-caregiver" onClick={handleLinkClick}>
                        Become a caregiver
                    </Link>
                </li>
                <li>
                    <Link to="/about-us" onClick={handleLinkClick}>
                        About us
                    </Link>
                </li>
                <li>
                    <Link to="/contentful-blog" onClick={handleLinkClick}>
                        Blog
                    </Link>
                </li>
            </ul>

            <div className="navbar-actions">
                {isAuthenticated && (
                    <div className="navbar-message-icon" onClick={handleMessageClick}>
                        <img src={messageIcon} alt="Messages" />
                    </div>
                )}
                <div className="navbar-cta">
                    <button onClick={handleCtaClick} className="btn-primary">
                        {isAuthenticated ? 'Sign Out' : 'Sign Up'} <span className="calendar-icon"><img src={arrow} alt="arrow-right" /></span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
