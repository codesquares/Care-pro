import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";
import logo from '../../../../assets/careproLogo.svg';
import hear from "../../../../assets/main-app/heart.svg";
import bellIcon from "../../../../assets/bell_icon.png";
import message from "../../../../assets/main-app/message.svg";
import receipt from "../../../../assets/main-app/receipt.svg";
import homeIcon from "../../../../assets/home_icon.png";
import settingIcon from "../../../../assets/setting.png";
import NotificationBell from "../../../components/notifications/NotificationBell";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../context/AuthContext";


const NavigationBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/caregiver";
  const dropdownRef = useRef(null);
  const { user, handleLogout } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
  });
  const [profileData, setProfileData] = useState(null);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  // Early return if no user data - prevents errors during logout
  if (!user) {
    return null;
  }

  const getInitials = (name) => {
  if (!name || typeof name !== "string") return "";

  const names = name.trim().split(" ").filter(Boolean); // remove empty parts
  const initials = names.map((n) => n[0].toUpperCase()).join("");

  return initials.slice(0, 2);
};

  // Helper function to render avatar content
  const renderAvatarContent = (className = "") => {
    const profileImage = profileData?.profilePicture;
    
    if (profileImage) {
      return (
        <img 
          src={profileImage} 
          alt={userName}
          className={`avatar-image ${className}`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return null; // Return null when no image, let the initials span handle the display
  };

 useEffect(() => {
    const fetchEarnings = async () => {
      try{
      const earnings = await fetch (`https://carepro-api20241118153443.azurewebsites.net/api/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

    const data = await earnings.json();
    setEarnings({
      totalEarned: data.totalAmountEarned,
    });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response && response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  fetchEarnings();
  fetchProfile();
}, [user?.id]); // Add optional chaining to prevent null errors

  const handleSignOut = () => {
    const navInfo = handleLogout();
    if (navInfo.shouldNavigate) {
      navigate(navInfo.path, { replace: true });
    }
  };

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const IconLink = ({ to, icon, alt }) => (
    <li className="nav-link icon-link" onClick={() => navigate(to)}>
      <img src={icon} alt={alt} />
    </li>
  );

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
                  {renderAvatarContent()}
                  <span className="avatar-initials" style={{ display: profileData?.profilePicture ? 'none' : 'flex' }}>
                    {getInitials(userName)}
                  </span>
                </div>
                <div className="user-info">
                  <span className="user-name">{userName}</span>
                  <div className="earnings-mobile">
                    <img src={receipt} alt="Earnings Icon" />
                    <span>Earned: ₦{earnings.totalEarned.toFixed(2)}</span>
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
              {/* <li onClick={() => { navigate(`${basePath}/orders`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={receipt} alt="Orders" />
                  <span>Orders</span>
                </div>
              </li> */}
              <li onClick={() => { navigate(`${basePath}/earnings`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <img src={receipt} alt="Earnings" />
                  <span>Earnings</span>
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
                    {renderAvatarContent("small-avatar")}
                    <span className="avatar-initials" style={{ display: profileData?.profilePicture ? 'none' : 'flex' }}>
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
          {/* <li className="nav-link text-link" onClick={() => navigate(`${basePath}/orders`)}>
            Orders
          </li>
          <li className="nav-link text-link" onClick={() => navigate(`${basePath}/earnings`)}>
            Earnings
          </li> */}
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

          <div className="earnings" onClick={() => navigate(`${basePath}/earnings`)}>
            <img src={receipt} alt="Earnings Icon" />
            <span>Earned:</span>
            <strong>₦{earnings.totalEarned.toFixed(2)}</strong>
          </div>

          <div className="profile-avatar" ref={dropdownRef}>
            {!profileData?.profilePicture && (
              <span onClick={() => setShowDropdown(!showDropdown)}>{userName}</span>
            )}
            <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
              {renderAvatarContent()}
              <span className="avatar-initials" style={{ display: profileData?.profilePicture ? 'none' : 'flex' }}>
                {getInitials(userName)}
              </span>
            </div>

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
