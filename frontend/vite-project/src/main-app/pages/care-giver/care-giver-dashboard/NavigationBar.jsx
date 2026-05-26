import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";
import logo from '../../../../assets/careproLogo.svg';
import hear from "../../../../assets/main-app/heart.svg";
import { FaBell, FaEnvelope, FaReceipt, FaHome, FaCog, FaStore, FaClipboardList, FaBriefcase, FaChevronDown, FaShoppingBag, FaWallet, FaPlusCircle } from "react-icons/fa";
import NotificationBell from "../../../components/notifications/NotificationBell";
import { useAuth } from "../../../context/AuthContext";
import { getInitials } from "../../../utils/avatarHelpers";
import config from "../../../config"; // Import centralized config for API URLs


const NavigationBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/caregiver";
  const dropdownRef = useRef(null);
  const { user, handleLogout } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  // ✅ Move useEffect hooks before any conditional returns
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

  const handleSignOut = () => {
    handleLogout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const IconLink = ({ to, icon: IconComponent, alt, isReactIcon = false }) => {
    return (
      <li className="nav-link icon-link" onClick={() => navigate(to)}>
        {isReactIcon ? (
          <IconComponent className="nav-react-icon" size={18} />
        ) : (
          <img src={IconComponent} alt={alt} />
        )}
      </li>
    );
  };

  return (
    <nav className="navigation-bar">
      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <div className="logo" onClick={() => navigate('/')}>
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
                  <FaHome className="mobile-menu-icon" />
                  <span>Dashboard</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/create-gigs`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaPlusCircle className="mobile-menu-icon" />
                  <span>Create Gig</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/profile`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaBriefcase className="mobile-menu-icon" />
                  <span>Manage Gigs</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/orders`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaReceipt className="mobile-menu-icon" />
                  <span>All Orders</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/client-requests`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <span className="mobile-menu-icon" style={{ fontSize: '16px' }}>📋</span>
                  <span>Client Requests</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/wallet`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaWallet className="mobile-menu-icon" />
                  <span>Wallet</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/subscriptions`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <span className="mobile-menu-icon" style={{ fontSize: '16px' }}>🔄</span>
                  <span>Subscriptions</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/message`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaEnvelope className="mobile-menu-icon" />
                  <span>Messages</span>
                </div>
              </li>
              <li onClick={() => { navigate(`${basePath}/settings`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaCog className="mobile-menu-icon" />
                  <span>Settings</span>
                </div>
              </li>
              <li onClick={() => { navigate('/marketplace'); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaStore className="mobile-menu-icon" />
                  <span>Browse Marketplace</span>
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
              <li className="caregiver-notifications-item" onClick={() => { navigate(`${basePath}/notifications`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <FaBell />
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
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logo} alt="CarePro Logo" />
        </div>

        <ul className="nav-links">
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/dashboard`)}>
            <FaHome className="nav-link-icon" />
            Dashboard
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/orders`)}>
            <FaShoppingBag className="nav-link-icon" />
            Orders
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/client-requests`)}>
            <FaClipboardList className="nav-link-icon" />
            Request
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/create-gigs`)}>
            <FaPlusCircle className="nav-link-icon" />
            Create Gig
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/profile`)}>
            <FaBriefcase className="nav-link-icon" />
            Manage Gigs
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/wallet`)}>
            <FaWallet className="nav-link-icon" />
            Wallet
          </li>
        </ul>

        <div className="nav-actions">
          <li className="caregiver-icon-link">
            <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={FaBell} />
          </li>
          <div className="nav-action-icon" onClick={() => navigate(`${basePath}/message`)}>
            <FaEnvelope size={18} />
          </div>

          <div className="profile-avatar" ref={dropdownRef}>
            <span className="nav-user-name" onClick={() => setShowDropdown(!showDropdown)}>
              {user?.firstName ? `${user.firstName}_${user.lastName?.charAt(0) || ''}` : ''}
            </span>
            <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="avatar-initials">
                {getInitials(userName)}
              </span>
            </div>
            <FaChevronDown className="dropdown-chevron" onClick={() => setShowDropdown(!showDropdown)} />

            {showDropdown && (
              <div className="nav-dropdown-menu dropdown-menu">
                <div className="nav-dropdown-item dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/profile`);
                }}>
                  View Profile
                </div>
                <div className="nav-dropdown-item dropdown-item" onClick={() => {
                  setShowDropdown(false);
                  navigate(`${basePath}/subscriptions`);
                }}>
                  Subscriptions
                </div>
                <div className="nav-dropdown-item dropdown-item" onClick={() => {
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

export default NavigationBar;
