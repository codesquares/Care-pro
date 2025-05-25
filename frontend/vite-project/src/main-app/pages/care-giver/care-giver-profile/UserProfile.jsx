import React from "react";
import ProfileHeader from "./ProfileHeader";
import GigsSection from "./GigsSection";
import Reviews from "./Reviews";
import "./user-profile.css";

const UserProfile = () => {
  const profileLayoutStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  };

  const profileLeftStyle = {
    width: "40%",
    flex: "0 0 40%",
  };

  const profileRightStyle = {
    width: "60%",
    flex: "0 0 60%",
  };

  return (
    <div className="user-profile" style={profileLayoutStyle}>
      <div className="profile-left" style={profileLeftStyle}>
        <ProfileHeader />
      </div>
      <div className="profile-right" style={profileRightStyle}>
        <GigsSection />
        <Reviews />
      </div>
    </div>
  );
};

export default UserProfile;
