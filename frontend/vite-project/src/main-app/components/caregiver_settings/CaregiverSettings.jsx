import React, { useEffect, useState } from "react";
import "./CaregiverSettings.scss";
import profileCardImage from "../../../assets/profilecard1.png"; // Placeholder image

const CaregiverSettings = () => {
  const [profile, setProfile] = useState({
    name: "",
    location: "",
    memberSince: "",
    username: "",
    picture: profileCardImage,
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails || !userDetails.id) {
          throw new Error("No caregiver ID found in local storage.");
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();

        setProfile({
          name: `${data.firstName} ${data.lastName}` || "N/A",
          username: data.email || "N/A",
          location: data.location || "N/A",
          memberSince: data.createdAt || "N/A",
          picture: data.picture || profileCardImage,
        });

        setIsAvailable(data.isAvailable); // assuming this field exists in API
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleAvailability = async (newAvailability) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) throw new Error("No caregiver ID found");

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverAvailability/${userDetails.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable: newAvailability }),
        }
      );

      if (!response.ok) throw new Error("Failed to update availability");

      setIsAvailable(newAvailability);
    } catch (err) {
      console.error(err.message);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="settings-container">
      <div className="profile-settings-wrapper">
        {/* Profile Section */}
        <div className="profile-info-section">
          <img src={profile.picture} alt="Profile" className="profile-image" />
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{profile.username}</p>
          <div className="profile-rating">★★★★☆ (29 reviews)</div>
          <p className="profile-location">Location: {profile.location}</p>
          <p className="profile-membership">Member since: {new Date(profile.memberSince).toDateString()}</p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        {/* Profile Info */}
        <div className="settings-box">
          <h3>Full Name</h3>
          <input type="text" value={profile.name} readOnly />
          <h3>Email</h3>
          <input type="email" value={profile.username} readOnly />
          <h3>Account Status</h3>
          <div className="status-buttons">
            <button
              className={isAvailable ? "active" : ""}
              onClick={() => toggleAvailability(true)}
              disabled={isAvailable}
            >
              Available
            </button>
            <button
              className={!isAvailable ? "inactive" : ""}
              onClick={() => toggleAvailability(false)}
              disabled={!isAvailable}
            >
              Unavailable
            </button>
          </div>
          <button className="save-button" disabled>Save Changes</button>
        </div>

        {/* Update Password */}
        <div className="settings-box">
          <h3>Update Password</h3>
          <input type="password" placeholder="Current Password" />
          <input type="password" placeholder="New Password" />
          <input type="password" placeholder="Confirm New Password" />
          <p className="password-hint">
            * 8 characters or longer. Combine upper and lowercase letters and numbers.
          </p>
          <button className="save-button">Save Changes</button>
        </div>

        {/* Account Deactivation */}
        <div className="settings-box">
          <h3>Account Deactivation</h3>
          <p className="deactivation-info">
            When you deactivate your account:
            <br /> - Your profile and gigs won’t be shown on their original places.
            <br /> - Active orders will be canceled.
            <br /> - You won’t be able to re-activate your gigs.
          </p>
          <select className="reason-dropdown">
            <option>Choose reason</option>
            <option>I no longer need this account</option>
            <option>I'm not satisfied with the service</option>
          </select>
          <button className="deactivate-button">Deactivate account</button>
        </div>
      </div>
    </div>
  );
};

export default CaregiverSettings;
