import React from "react";

const ProfileHeader = () => {
  return (
    <div className="profile-container">
    <div className="profile-header">
      <img src="profile-pic.jpg" alt="Profile" />
      <h2>Ahmed Rufai</h2>
      <p>@ahmedrufai20</p>
      <p>"Interested in giving the best healthcare services to your taste?"</p>
      <div className="rating">
        ⭐⭐⭐⭐⭐ (4.0/400 reviews)
      </div>
      <button className="status-button">Available</button>
    </div>
    <hr></hr>
    <div className="profile-details">
      <p>📍location:  <strong/>Lagos, Nigeria<strong/></p>
      <p>Member since: 20th June, 2024</p>
      <p>Last Delivery: 1 month ago</p>
    </div>
    <hr></hr>
    <div className="button">
        <button className="edit-button">Available</button>
        <button className="delete-button">Unavailable</button>
    </div>
    </div>
  );
};

export default ProfileHeader;
