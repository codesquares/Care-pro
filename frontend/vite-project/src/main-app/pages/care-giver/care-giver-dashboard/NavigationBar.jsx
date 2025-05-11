import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";
import logo from '../../../../assets/careproLogo.svg';
import hear from "../../../../assets/main-app/heart.svg";
import bell from "../../../../assets/main-app/notification-bing.svg";
import message from "../../../../assets/main-app/message.svg";
import receipt from "../../../../assets/main-app/receipt.svg";
import useMessaging from "../../../hooks/useMessaging";

const NavigationBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/caregiver";
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userId = user?.id || localStorage.getItem("userId");
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";
  
  // Get messaging features - including unread messages count
  const { totalUnreadMessages } = useMessaging(userId);

  const getInitials = (name) => {
    const names = name.split(" ");
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    return initials.slice(0, 2);
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login"); // or your login route
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

  const IconLink = ({ to, icon, alt }) => (
    <li className="nav-link icon-link" onClick={() => navigate(to)}>
      <img src={icon} alt={alt} />
    </li>
  );

  return (
    <nav className="navigation-bar">
      <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
        <img src={logo} alt="CarePro Logo" />
      </div>

      <ul className="nav-links">
        <li className="nav-link text-link" onClick={() => navigate(`${basePath}/dashboard`)}>
          Dashboard
        </li>
        <li className="nav-link text-link" onClick={() => navigate(`${basePath}/settings`)}>
          Settings
        </li>
      </ul>

      <ul className="nav-icons">
        <IconLink to={`${basePath}/notifications`} icon={bell} alt="Notifications" />
        <li className="nav-link icon-link" onClick={() => navigate(`${basePath}/messages`)}>
          <div className="icon-with-badge">
            <img src={message} alt="Messages" />
            {totalUnreadMessages > 0 && (
              <span className="badge">{totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}</span>
            )}
          </div>
        </li>
        <IconLink to={`${basePath}/favorites`} icon={hear} alt="Favorites" />
      </ul>

      <div className="nav-actions">
        <div className="earnings" onClick={() => navigate(`${basePath}/earnings`)}>
          <img src={receipt} alt="Earnings Icon" />
          <span>Earned:</span>
          <strong>₦300,000.00</strong>
        </div>

        <div className="profile-avatar" ref={dropdownRef}>
          <span onClick={() => setShowDropdown(!showDropdown)}>{userName}</span>
          <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {getInitials(userName)}
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => navigate(`${basePath}/profile`)}>
                View Profile
              </div>
              <div className="dropdown-item" onClick={handleSignOut}>
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
