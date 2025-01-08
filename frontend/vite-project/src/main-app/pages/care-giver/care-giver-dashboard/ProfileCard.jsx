import React from "react";
import "./ProfileCard.css"; // Ensure this file includes the styles below

const ProfileCard = () => {
  return (
    <div className="profile-card">
      <img
        src="https://via.placeholder.com/80"
        alt="Profile"
        className="profile-picture"
      />
      <h3 className="profile-name">Ahmed Rufai</h3>
      <p className="profile-username">@ahmedrufai209</p>
      <div className="availability-buttons">
        <button className="availability-button available">Available</button>
        <button className="availability-button unavailable">Unavailable</button>
      </div>
    </div>
  );
};

export default ProfileCard;
