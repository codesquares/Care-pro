import React from "react";
import "./profile-header.css";

const ProfileHeader = () => (
  <div className="profile-header">
    <img src="profile-pic.jpg" alt="Profile" className="profile-img" />
    <h2>Ahmed Rufai</h2>
    <p>@ahmedrufai209</p>
    <p>“Interested in giving the best healthcare services to your taste?”</p>
    <div className="rating">⭐⭐⭐⭐⭐ (4.0, 200 Reviews)</div>
    <div className="details">
      <p>📍 Lagos, Nigeria</p>
      <p>📅 Member since: 20th June, 2024</p>
      <p>📦 Last Delivery: 1 month ago</p>
    </div>
    <button className="availability-btn">Available</button>
  </div>
);

export default ProfileHeader;
