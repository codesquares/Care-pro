import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from '../../../assets/careproLogo.svg';
import hear from "../../../assets/main-app/heart.svg";
import bellIcon from "../../../assets/bell_icon.png";
import message from "../../../assets/main-app/message.svg";
import receipt from "../../../assets/main-app/receipt.svg";
import homeIcon from "../../../assets/home_icon.png";
import settingIcon from "../../../assets/setting.png";
import NotificationBell from "../../components/notifications/NotificationBell";
import { useAuth } from "../../context/AuthContext";
// import "../care-giver/care-giver-dashboard/NavigationBar.css";
import "./ClientNavBarCustom.css";

const ClientNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = "/app/client";
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const { user, handleLogout } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  // Early return if no user data - prevents errors during logout
  if (!user) {
    return null;
  }

  // Initialize search query from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
  }, [location.search]);

  // Listen for clear search events from dashboard
  useEffect(() => {
    const handleClearSearch = () => {
      setSearchQuery('');
      setIsTyping(false);
    };

    window.addEventListener('clearSearch', handleClearSearch);
    
    return () => {
      window.removeEventListener('clearSearch', handleClearSearch);
    };
  }, []);

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";

    const names = name.trim().split(" ").filter(Boolean); // remove empty parts
    const initials = names.map((n) => n[0].toUpperCase()).join("");

    return initials.slice(0, 2);
  };

  const IconLink = ({ to, icon, alt }) => (
    <li className="client-nav-link client-icon-link" onClick={() => navigate(to)}>
      <img src={icon} alt={alt} />
    </li>
  );

  const handleSignOut = () => {
    const navInfo = handleLogout();
    if (navInfo.shouldNavigate) {
      navigate(navInfo.path, { replace: true });
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsTyping(false); // Reset typing state on form submission
    if (searchQuery.trim()) {
      // Navigate to dashboard with search query parameter
      navigate(`${basePath}/dashboard?q=${encodeURIComponent(searchQuery.trim())}`);
      // Dispatch search event with completed search
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: searchQuery.trim(), isSearching: false } 
      }));
    } else {
      // If empty search, go to dashboard without query
      navigate(`${basePath}/dashboard`);
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: '', isSearching: false } 
      }));
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Set typing state to true when user starts typing
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      // Immediately notify that searching has started
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: value.trim(), isSearching: true } 
      }));
    }
    
    // If search is cleared, immediately notify and reset typing state
    if (!value.trim()) {
      setIsTyping(false);
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: '', isSearching: false } 
      }));
      if (location.pathname === `${basePath}/dashboard`) {
        window.history.pushState({}, '', `${basePath}/dashboard`);
      }
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set up debounced navigation for real-time search
    debounceRef.current = setTimeout(() => {
      if (location.pathname === `${basePath}/dashboard`) {
        // Only update URL if we're already on dashboard
        if (value.trim()) {
          const newUrl = `${basePath}/dashboard?q=${encodeURIComponent(value.trim())}`;
          window.history.pushState({}, '', newUrl);
          // Trigger a custom event to notify dashboard of URL change
          window.dispatchEvent(new CustomEvent('searchChanged', { 
            detail: { searchQuery: value.trim(), isSearching: false } 
          }));
        }
      }
      // Reset typing state after debounce period
      setIsTyping(false);
    }, 300); // 300ms debounce
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <nav className="client-navigation-bar">
      {/* Mobile Navigation */}
      <div className="client-mobile-nav">
        <div className="client-logo" onClick={() => navigate('/')}>
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
              <li onClick={() => { navigate(`${basePath}/my-order`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <img src={receipt} alt="Orders" />
                  <span>My Orders</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/message`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <img src={message} alt="Messages" />
                  <span>Messages</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/settings`); setMobileMenuOpen(false); }}>
                <div className="client-menu-item-content">
                  <img src={settingIcon} alt="Settings" />
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
              <li className="client-notifications-item">
                <div className="client-menu-item-content" onClick={() => setMobileMenuOpen(false)}>
                  <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={bellIcon} />
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
        <div className="client-logo" onClick={() => navigate('/')}>
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
          <ul className="client-nav-icons">
            <li className="client-nav-link client-icon-link" onClick={() => navigate(`${basePath}/settings`)}>
              <img src={settingIcon} alt="Settings" />
            </li>
            <li className="client-nav-link client-icon-link">
              <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={bellIcon} />
            </li>
            <IconLink to={`${basePath}/message`} icon={message} alt="Messages" />
            {/* <IconLink to={`${basePath}/favorites`} icon={hear} alt="Favorites" /> */}
          </ul>

          <div className="client-earnings" onClick={() => navigate(`${basePath}/my-order`)}>
            <img src={receipt} alt="Orders Icon" />
            <span>View Orders</span>
          </div>

          <div className="client-profile-avatar" ref={dropdownRef}>
            <span className="client-user-name-text" onClick={() => setShowDropdown(!showDropdown)}>
              {`${user?.firstName + " " + user?.lastName || "User"}`}
            </span>
            <div className="client-avatar" onClick={() => setShowDropdown(!showDropdown)}>
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="client-avatar-image"
                />
              ) : (
                <span className="client-avatar-initials">
                  {getInitials(userName)}
                </span>
              )}
            </div>
            <div className="client-dropdown-arrow" onClick={() => setShowDropdown(!showDropdown)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
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
