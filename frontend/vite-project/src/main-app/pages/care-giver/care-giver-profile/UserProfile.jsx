import React from "react";
import ProfileHeader from "./ProfileHeader";
import GigsSection from "./GigsSection";
import Reviews from "./Reviews";
import "./user-profile.css";

const UserProfile = () => {
  return (
    <div className="user-profile">
      <aside className="profile-left">
        <ProfileHeader />
      </aside>
      <main className="profile-right">
        <GigsSection />
        <Reviews />
      </main>
    </div>
  );
};

export default UserProfile;
