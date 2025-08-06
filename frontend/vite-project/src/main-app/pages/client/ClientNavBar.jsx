import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../../assets/careproLogo.svg';
import hear from "../../../assets/main-app/heart.svg";
import bellIcon from "../../../assets/bell_icon.png";
import message from "../../../assets/main-app/message.svg";
import receipt from "../../../assets/main-app/receipt.svg";
import homeIcon from "../../../assets/home_icon.png";
import settingIcon from "../../../assets/setting.png";
import NotificationBell from "../../components/notifications/NotificationBell";
import "../care-giver/care-giver-dashboard/NavigationBar.css";

const ClientNavBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/client";
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";

    const names = name.trim().split(" ").filter(Boolean); // remove empty parts
    const initials = names.map((n) => n[0].toUpperCase()).join("");

    return initials.slice(0, 2);
  };

  const IconLink = ({ to, icon, alt }) => (
    <li className="nav-link icon-link" onClick={() => navigate(to)}>
      <img src={icon} alt={alt} />
    </li>
  );

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
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

  return (
    <nav className="navigation-bar">
      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
          <img src={logo} alt="CarePro Logo" />
        </div>
        <button 
          className="hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-menu-user">
                <div className="avatar">
                  <span className="avatar-initials">
                    {getInitials(userName)}
                  </span>
                </div>
                <div className="user-info">
                  <span className="user-name">{userName}</span>
                  <div className="earnings-mobile">
                    <img src={receipt} alt="Orders Icon" />
                    <span>View Orders</span>
                  </div>
                </div>
              </div>
              <button 
                className="close-menu"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            
            <ul className="mobile-menu-links">
              <li onClick={() => { navigate(`${basePath}/dashboard`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={homeIcon} alt="Dashboard" />
                  <span>Dashboard</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/my-order`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={receipt} alt="Orders" />
                  <span>My Orders</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/message`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={message} alt="Messages" />
                  <span>Messages</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/settings`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={settingIcon} alt="Settings" />
                  <span>Settings</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/profile`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <div className="avatar small-avatar">
                    <span className="avatar-initials">
                      {getInitials(userName)}
                    </span>
                  </div>
                  <span>Profile</span>
                </div>
              </li>
              <li className="notifications-item">
                <div className="menu-item-content" onClick={() => setMobileMenuOpen(false)}>
                  <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={bellIcon} />
                  <span>Notifications</span>
                </div>
              </li>
              <li onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="sign-out">
                <div className="menu-item-content">
                  <span>🚪</span>
                  <span>Sign Out</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="desktop-nav">
        <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
          <img src={logo} alt="CarePro Logo" />
        </div>

        <ul className="nav-links">
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/dashboard`)}>
            Dashboard
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/my-order`)}>
            My Orders
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/settings`)}>
            Settings
          </li>
        </ul>

        <div className="nav-actions">
          <ul className="nav-icons">
            <li className="nav-link icon-link">
              <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={bellIcon} />
            </li>
            <IconLink to={`${basePath}/message`} icon={message} alt="Messages" />
          </ul>

          <div className="earnings" onClick={() => navigate(`${basePath}/my-order`)}>
            <img src={receipt} alt="Orders Icon" />
            <span>View</span>
            <strong>Orders</strong>
          </div>

          <div className="profile-avatar" ref={dropdownRef}>
            <span onClick={() => setShowDropdown(!showDropdown)}>{userName}</span>
            <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
              {getInitials(userName)}
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/profile`);
                }}>
                  View Profile
                </div>
                <div className="dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/settings`);
                }}>
                  Settings
                </div>
                <div className="dropdown-item" onClick={() => {
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
