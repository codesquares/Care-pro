import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileCard.css";
import profilecard1 from "../../../../assets/profilecard1.png";

const ProfileCard = () => {
  const navigate = useNavigate();
  const basePath = "/app/caregiver";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const caregiverId = userDetails?.id;

    if (!caregiverId) {
      setError("No caregiver ID found.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${caregiverId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Note: No dependencies here — it's safe!
  console.log("profile===>", profile);

  console.log("profile is running");
  // get the user's first name and first two letters of profile id and last two letters of profile id and last two letters of profile last name and concatenate them to form a username
  let userName = "";
   if(profile){
     userName = profile.firstName + profile.lastName+profile.id.slice(0,2)+profile.id.slice(-2)+profile.lastName.slice(-2);
   }else{
     userName = "guestUser209";
   }
  console.log("userName===>", userName);
  // save the username to localStorage
  localStorage.setItem("userName", userName);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="profile-card">
      <img
        src={profile?.profilePicture || profilecard1}
        alt="Profile"
        className="profile-picture"
      />
      <h3 className="profile-name">
        {profile?.firstName && profile?.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : "Ahmed Rufai"}
      </h3>
      <p className="profile-username">@{userName}</p>
      <div
        className="view-profile"
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`${basePath}/Profile`)}
      >
        View Profile
      </div>
      <div className="availability-buttons">
        <button className="availability-button available">Available</button>
        <button className="availability-button unavailable">Unavailable</button>
      </div>
    </div>
  );
};

export default ProfileCard;
