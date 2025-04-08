import React from "react";
import { useNavigate } from "react-router-dom";
import "./NavigationBar.css";
import logo from '../../../../assets/careproLogo.svg';

const NavigationBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/caregiver"; // Base path for your routes

  //get the user name from local storage
  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : "";

  // Function to generate initials from the name
  const getInitials = (name) => {
    const names = name.split(" ");
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    return initials.slice(0, 2); // Get the first two initials
  };

  return (
    <nav className="navigation-bar">
      <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
        <img src={logo} alt="CarePro Logo" />
      </div>
      <ul className="nav-links">
        <li
          className="nav-link"
          onClick={() => navigate(`${basePath}/dashboard`)}
        >
          Dashboard
        </li>
        <li
          className="nav-link"
          onClick={() => navigate(`${basePath}/settings`)}
        >
          Settings
        </li>
        <li
          className="nav-link"
          onClick={() => navigate(`${basePath}/favorites`)}
        >
          <i className="icon heart-icon">❤️</i>
        </li>
        <li
          className="nav-link"
          onClick={() => navigate(`${basePath}/notifications`)}
        >
          <i className="icon bell-icon">🔔</i>
        </li>
      </ul>
      <div className="nav-actions">
        <button
          className="view-orders"
          onClick={() => navigate(`${basePath}/orders`)}
        >
          View Orders
        </button>
        <div className="earnings"  onClick={() => navigate(`${basePath}/earnings`)}>
          <span>Earned:</span>
          <strong>₦300,000.00</strong>
        </div>
        <div
          className="profile-avatar"
          onClick={() => navigate(`${basePath}/profile`)}
        >
          <span>{userName}</span>
          {/* Avatar with initials */}
          <div className="avatar">{getInitials(userName)}</div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
