import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaEnvelope, FaCog, FaHome, FaClipboardList, FaFileAlt, FaChevronDown } from "react-icons/fa";
import logo from '../../../assets/careproLogo.svg';

import homeIcon from "../../../assets/home_icon.png";
import NotificationBell from "../../components/notifications/NotificationBell";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/avatarHelpers";
// import "../care-giver/care-giver-dashboard/NavigationBar.css";
import "./ClientNavBarCustom.css";

const ClientNavBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/client";
  const dropdownRef = useRef(null);
  const { user, handleLogout } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Early return if no user data - prevents errors during logout
  if (!user) {
    return null;
  }

  const IconLink = ({ to, icon, alt, isReactIcon = false }) => (
    <li className="client-nav-link client-icon-link" onClick={() => navigate(to)}>
      {isReactIcon ? (
        React.createElement(icon, { className: "client-nav-icon", alt })
      ) : (
        <img src={icon} alt={alt} />
      )}
    </li>
  );

  const handleSignOut = () => {
    handleLogout();
    navigate('/', { replace: true });
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <nav className="client-navigation-bar">
      {/* Mobile Navigation */}
      <div className="client-mobile-nav">
        <div className="client-logo" onClick={() => navigate('/marketplace')}>
          <img src={logo} alt="CarePro Logo" />
        </div>
        <button 
          className="client-hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile: User name and search bar below nav */}
      <div className="client-mobile-user-search">
        <div className="client-mobile-search-container">
          <form onSubmit={handleSearch} className={`client-mobile-search-form ${searchQuery ? 'has-value' : ''}`}>
            <input
              type="text"
              placeholder="What service are you looking for today?"
              value={searchQuery}
              onChange={handleSearchInputChange}
              className={`client-mobile-search-input ${searchQuery ? 'has-value' : ''}`}
            />
            <button type="submit" className="client-mobile-search-button" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="client-mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="client-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="client-mobile-menu-header">
              <button 
                className="client-close-menu"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
                        <ul className="client-mobile-menu-links">
              <li onClick={() => { navigate(`${basePath}/dashboard`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <img src={homeIcon} alt="Dashboard" />
                  <span>Dashboard</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/requests`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <FaFileAlt className="client-nav-icon" />
                  <span>My Requests</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/subscriptions`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <span className="client-nav-icon" style={{ fontSize: '16px' }}>🔄</span>
                  <span>Subscriptions</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/message`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <FaEnvelope className="client-nav-icon" />
                  <span>Messages</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/verification`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <span className="client-nav-icon" style={{ fontSize: '16px' }}>🛡️</span>
                  <span>Verify My Identity</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/settings`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <FaCog className="client-nav-icon" />
                  <span>Settings</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/profile`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <div className="client-avatar client-small-avatar">
                    <span className="client-avatar-initials">
                      {getInitials(userName)}
                    </span>
                  </div>
                  <span>Profile</span>
                </div>
              </li>
              <li className="client-notifications-item" onClick={() => { navigate(`${basePath}/notifications`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <FaBell />
                  <span>Notifications</span>
                </div>
              </li>
              <li onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="client-sign-out">
                <div className="client-menu-item-content">
                  <span>🚪</span>
                  <span>Sign Out</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="client-desktop-nav">
        <div className="client-logo" onClick={() => navigate('/marketplace')}>
          <img src={logo} alt="CarePro Logo" />
        </div>

        {/* Search Bar */}
        <div className="client-search-container">
          <form onSubmit={handleSearch} className="client-search-form">
            <input
              type="text"
              placeholder="What service are you looking for today?"
              value={searchQuery}
              onChange={handleSearchInputChange}
              className={`client-search-input ${searchQuery ? 'has-value' : ''}`}
            />
            <button type="submit" className="client-search-button" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>

        <div className="client-nav-actions">
          <div className="client-standalone-icons">
            <div className="client-standalone-icon" onClick={() => navigate(`${basePath}/notifications`)}>
              <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={FaBell} />
            </div>
            <div className="client-standalone-icon" onClick={() => navigate(`${basePath}/message`)}>
              <FaEnvelope size={18} />
            </div>
          </div>

          <ul className="client-nav-links">
            <li className="client-nav-text-link" onClick={() => navigate(`${basePath}/dashboard`)}>
              <FaHome className="client-nav-link-icon" />
              Dashboard
            </li>
            <li className="client-nav-text-link" onClick={() => navigate(`${basePath}/requests`)}>
              <FaFileAlt className="client-nav-link-icon" />
              My Requests
            </li>
            <li className="client-nav-text-link" onClick={() => navigate('/marketplace')}>
              <FaClipboardList className="client-nav-link-icon" />
              Packages
            </li>
          </ul>

          <div className="client-profile-avatar" ref={dropdownRef}>
            <span className="client-user-name-text" onClick={() => setShowDropdown(!showDropdown)}>
              {user?.firstName ? `${user.firstName}_${user.lastName?.charAt(0)?.toLowerCase() || ''}` : 'User'}
            </span>
            <div className="client-avatar" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="client-avatar-initials">
                {getInitials(userName)}
              </span>
            </div>
            <FaChevronDown className="client-dropdown-chevron" onClick={() => setShowDropdown(!showDropdown)} />
            {showDropdown && (
              <div className="client-dropdown-menu">
                <div className="client-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/profile`);
                }}>
                  View Profile
                </div>
                <div className="client-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/subscriptions`);
                }}>
                  Subscriptions
                </div>
                <div className="client-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/verification`);
                }}>
                  Verify My Identity
                </div>
                <div className="client-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/settings`);
                }}>
                  Settings
                </div>
                <div className="client-dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  handleSignOut();
                }}>
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavBar;
