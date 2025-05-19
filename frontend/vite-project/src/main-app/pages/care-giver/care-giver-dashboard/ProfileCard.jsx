import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileCard.css"; // Ensure this file includes the styles below
import profilecard1 from '../../../../assets/profilecard1.png'; // Placeholder image

const ProfileCard = () => {
    const navigate = useNavigate();
    const basePath = "/app/caregiver";
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve user details from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const caregiverId = userDetails?.id; // Ensure this matches your API user ID

  // API URL for the profile
  const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${caregiverId}`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  
  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error: {error}</p>;
  console.log("Profile data:", profile); // Log the fetched profile data
  

  return (
    <div className="profile-card">
      <img
        src={profile?.profilePicture || profilecard1} // Use fetched profile picture or placeholder
        alt="Profile"
        className="profile-picture"
      />
      <h3 className="profile-name">{`${profile?.firstName} ${profile?.lastName}` || "Ahmed Rufai"}</h3> {/* Dynamic name */}
      <p className="profile-username">@{profile?.username || "ahmedrufai209"}</p> {/* Dynamic username */}
      <div
        className="view-profile"
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`${basePath}/Profile`)}
      >
        View Profile
      </div>
      {/* <div className="availability-buttons">
        <button className="availability-button available">Available</button>
        <button className="availability-button unavailable">Unavailable</button>
      </div> */}
    </div>
  );
};

export default ProfileCard;
