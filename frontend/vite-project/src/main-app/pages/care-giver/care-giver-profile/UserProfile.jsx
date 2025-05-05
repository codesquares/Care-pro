import React from "react";
import ProfileHeader from "./ProfileHeader";
import IntroVideo from "./IntroVideo";
import ProfileInformation from "./ProfileInformation";
import GigsSection from "./GigsSection";
import Reviews from "./Reviews";
import "./user-profile.css"; 

const UserProfile = () => {
  return (
    <div className="user-profile">
      <div className="profile-left">
        <ProfileHeader />
      </div>
      <div className="profile-right">
        <GigsSection />
        <Reviews />
      </div>
    </div>
  );
};

export default UserProfile;
