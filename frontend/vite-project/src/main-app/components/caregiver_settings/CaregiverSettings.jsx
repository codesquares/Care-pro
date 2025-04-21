import React from "react";
import "./CaregiverSettings.scss";
import { useEffect, useState } from "react";
import profileCardImage from "../../../assets/profilecard1.png"; // Placeholder image

const CaregiverSettings = () => {
    const [profile, setProfile] = useState({
            name: "",
        
            location: "",
            memberSince: "",
            username: "",
            
        });
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState("");
          useEffect(() => {
            const fetchProfile = async () => {
              try {
                // Retrieve userDetails from local storage and parse it
                const userDetails = JSON.parse(localStorage.getItem("userDetails"));
                console.log(userDetails.id);
                if (!userDetails || !userDetails.id) {
                  throw new Error("No caregiver ID found in local storage.");
                }
        
                // Use the id from userDetails
                const response = await fetch(
                  `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`
                );
                
        
                if (!response.ok) {
                  throw new Error("Failed to fetch profile data.");
                }
        
                const data = await response.json();
                console.log(data);
        
                // Map API response to the state
                setProfile({
                  name: `${data.firstName} ${data.lastName}` || "N/A", // Use firstName and lastName if available, otherwise use "N/A"data.firstName || "N/A",
                  username: data.email || "N/A",
                //   bio: data.introduction || "“Interested in giving the best healthcare services to your taste?”",
                //   rating: data.rating || 0,
                //   reviews: data.reviews || 0,
                  location: data.location || "N/A",
                  memberSince: data.createdAt || "N/A",
                //   lastDelivery: data.lastDelivery || "N/A",
                  picture: data.picture || profileCardImage,
                });
                setIsLoading(false);
              } catch (err) {
                setError(err.message);
                setIsLoading(false);
              }
            };
        
            fetchProfile();
          }, []);
        
          if (isLoading) return <p>Loading...</p>;
          if (error) return <p>Error: {error}</p>;
    return (
        <div className="settings-container">
            {/* I commented this out since it overlaps with the layout and im not sure how to fix <Navbar />*/}
            <div className="profile-settings-wrapper">
                {/* Profile Section */}
                <div className="profile-info-section">
                    <img src={profileCardImage} alt="Profile" className="profile-image" />
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-email">{profile.username}</p>
                    <div className="profile-rating">★★★★☆ (29 reviews)</div>
                    {/*I know the spaces arent the cleanest solution but they seemed the easiest if you need me to change it please let me know*/}
                    <p className="profile-location">Location                             Lagos, Nigeria</p>
                    <p className="profile-membership">Member since               20th June, 2024</p>
                </div>
            </div>

            {/* Settings Section */}
            <div className="settings-section">
                {/* Profile Info */}
                <div className="settings-box">
                    <h3>Full Name</h3>
                    <input type="text" placeholder={profile.name} />
                    <h3>Email</h3>
                    <input type="email" placeholder={profile.username} />
                    <h3>Account Status</h3>
                    <div className="status-buttons">
                        <button className="active">Available</button>
                        <button className="inactive">Unavailable</button>
                    </div>
                    <button className="save-button">Save Changes</button>
                </div>

                {/* Update Password */}
                <div className="settings-box">
                    <h3>Update Password</h3>
                    <input type="password" placeholder="Current Password" />
                    <input type="password" placeholder="New Password" />
                    <input type="password" placeholder="Confirm New Password" />
                    <p className="password-hint">* 8 characters or longer. Combine upper and lowercase letters and numbers.</p>
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
