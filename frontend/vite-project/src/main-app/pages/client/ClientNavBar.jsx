import React from "react";
import { useNavigate } from "react-router-dom";
import "../care-giver/care-giver-dashboard/NavigationBar.css";
import { FaSearch, FaUser, FaShoppingCart } from "react-icons/fa";

const ClientNavBar = () => {
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
        <img src="https://via.placeholder.com/50" alt="CarePro Logo" />
        <span>CarePro</span>
      </div>
      <div className="search-bar">
              <FaSearch size={20} />
              <input type="text" placeholder="What are you looking for today?" />
            </div>
            <div className="icons">
              <FaShoppingCart size={20} />
              <FaUser size={20} />
            </div>
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

export default ClientNavBar;
