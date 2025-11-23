import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileCard.css";
import profilecard1 from "../../../../assets/profilecard1.png";
import { generateUsername } from "../../../utils/usernameGenerator";
import config from "../../../config"; // Import centralized config for API URLs

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
        // Use centralized config instead of hardcoded URL for consistent API routing
        const response = await fetch(
          `${config.BASE_URL}/CareGivers/${caregiverId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Note: No dependencies here — it's safe!
  
  console.log("profile===>", profile);
  console.log("profile is running");
  
  // Generate username using centralized utility
  let userName = "";
  if (profile) {
    userName = generateUsername(
      profile.firstName,
      profile.email,
      profile.createdAt
    );
  } else {
    userName = "guest000000"; // Fallback handled by utility
  }
  console.log("userName===>", userName);
  // save the username to localStorage
  localStorage.setItem("userName", userName);

  if (loading) return (
    <div className="profile-card">
      <div className="profile-loading">
        <p>Loading profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="profile-card">
      <div className="profile-error">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="profile-card">
      <div className="profile-picture-container">
        {profile?.profileImage && profile.profileImage !== profilecard1 ? (
          <img
            src={profile.profileImage}
            alt="Profile"
            className="profile-picture"
          />
        ) : (
          <div className="profile-initials-avatar">
            {profile?.firstName && profile?.lastName
              ? `${profile.firstName.charAt(0).toUpperCase()}${profile.lastName.charAt(0).toUpperCase()}`
              : "AR"
            }
          </div>
        )}
      </div>
      
      {/* capitalize first letter of each word in name */}
      <h3 className="profile-name">
        {profile?.firstName && profile?.lastName
          ? `${profile.firstName.charAt(0).toUpperCase() + profile.firstName.slice(1)} ${profile.lastName.charAt(0).toUpperCase() + profile.lastName.slice(1)}`
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
      {/* <div className="availability-buttons">
        <button className="availability-button available">Available</button>
        <button className="availability-button unavailable">Unavailable</button>
      </div> */}
    </div>
  );
};

export default ProfileCard;
