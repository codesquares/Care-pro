import React from "react";
import "./ProfileCard.css"; // Ensure this file includes the styles below
import profilecard1 from '../../../../assets/profilecard1.png';

const ProfileCard = () => {
  return (
    <div className="profile-card">
      <img
        src={profilecard1}
        alt="Profile"
        className="profile-picture"
      />
      <h3 className="profile-name">Ahmed Rufai</h3>
      <p className="profile-username">@ahmedrufai209</p>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="view-profile"
      >
        View Profile
      </a>
      <div className="availability-buttons">
        <button className="availability-button available">Available</button>
        <button className="availability-button unavailable">Unavailable</button>
      </div>
    </div>
  );
};

export default ProfileCard;
