import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../../assets/careproLogo.svg';
import hear from "../../../assets/main-app/heart.svg";
import bell from "../../../assets/main-app/notification-bing.svg";
import message from "../../../assets/main-app/message.svg";
import receipt from "../../../assets/main-app/receipt.svg";
import "../care-giver/care-giver-dashboard/NavigationBar.css";

const ClientNavBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/client";
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  const getInitials = (name) => {
    const names = name.split(" ");
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
    navigate("/login"); // Adjust if your login route is different
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

  return (
    <nav className="navigation-bar">
      <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
        <img src={logo} alt="CarePro Logo" />
      </div>

      <ul className="nav-icons">
        <IconLink to={`${basePath}/notifications`} icon={bell} alt="Notifications" />
        <IconLink to={`${basePath}/message`} icon={message} alt="Messages" />
        <IconLink to={`${basePath}/favorites`} icon={hear} alt="Favorites" />
      </ul>

      <div className="nav-actions">
        <div className="earnings" onClick={() => navigate(`${basePath}/my-order`)}>
          <img src={receipt} alt="Earnings Icon" />
          <strong>View Order</strong>
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
              <div className="dropdown-item" onClick={() => navigate(`${basePath}/verification`)}>
                Verify Account
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

export default ClientNavBar;
