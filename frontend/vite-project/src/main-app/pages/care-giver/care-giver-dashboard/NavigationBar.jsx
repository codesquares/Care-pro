import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";
import logo from '../../../../assets/careproLogo.svg';
import hear from "../../../../assets/main-app/heart.svg";
import { FaBell, FaEnvelope, FaReceipt, FaHome, FaCog } from "react-icons/fa";
import NotificationBell from "../../../components/notifications/NotificationBell";
import { useAuth } from "../../../context/AuthContext";
import config from "../../../config"; // Import centralized config for API URLs


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

  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  // ✅ Move useEffect hooks before any conditional returns
  useEffect(() => {
    if (!user) return; // Handle no user case inside the effect
    
    const fetchEarnings = async () => {
      try{
      // Use centralized config instead of hardcoded URL for consistent API routing
      const earnings = await fetch (`${config.BASE_URL}/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await earnings.json();
      console.log('earnings data:', data);
      setEarnings({
        totalEarned: data.totalAmountEarned,
      });
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
    };
    
    fetchEarnings();
  }, [user]);

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

  const getInitials = (name) => {
  if (!name || typeof name !== "string") return "";

  const names = name.trim().split(" ").filter(Boolean); // remove empty parts
  const initials = names.map((n) => n[0].toUpperCase()).join("");

  return initials.slice(0, 2);
};

  // Helper function to render avatar content
  const renderAvatarContent = (className = "") => {
    const profileImage = user?.profileImage || user?.profilePicture;
    
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
                  {renderAvatarContent()}
                  <span className="avatar-initials" style={{ display: (user?.profileImage || user?.profilePicture) ? 'none' : 'flex' }}>
                    {getInitials(userName)}
                  </span>
                </div>
                <div className="user-info">
                  <span className="user-name">{userName}</span>
                  <div className="earnings-mobile">
                    <FaReceipt className="mobile-menu-icon" size={20} />
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
                  <FaHome className="mobile-menu-icon" />
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
                  <FaReceipt className="mobile-menu-icon" />
                  <span>Earnings</span>
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
              <li onClick={() => { navigate(`${basePath}/profile`); setMobileMenuOpen(false); }}>
                <div className="menu-item-content">
                  <div className="avatar small-avatar">
                    {renderAvatarContent("small-avatar")}
                    <span className="avatar-initials" style={{ display: (user?.profileImage || user?.profilePicture) ? 'none' : 'flex' }}>
                      {getInitials(userName)}
                    </span>
                  </div>
                  <span>Profile</span>
                </div>
              </li>
              <li className="notifications-item">
                <div className="menu-item-content" onClick={() => setMobileMenuOpen(false)}>
                  <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={FaBell} />
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
              <NotificationBell navigateTo={(path) => navigate(path)} bellIcon={FaBell} />
            </li>
            <IconLink to={`${basePath}/message`} icon={FaEnvelope} alt="Messages" isReactIcon={true} />
          </ul>

          <div className="earnings" onClick={() => navigate(`${basePath}/earnings`)}>
            <FaReceipt className="earnings-icon" size={20} />
            <span>Earned:</span>
            <strong>₦{earnings.totalEarned.toFixed(2)}</strong>
          </div>

          <div className="profile-avatar" ref={dropdownRef}>
            {!(user?.profileImage || user?.profilePicture) && (
              <span onClick={() => setShowDropdown(!showDropdown)}>{userName}</span>
            )}
            <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
              {renderAvatarContent()}
              <span className="avatar-initials" style={{ display: (user?.profileImage || user?.profilePicture) ? 'none' : 'flex' }}>
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
