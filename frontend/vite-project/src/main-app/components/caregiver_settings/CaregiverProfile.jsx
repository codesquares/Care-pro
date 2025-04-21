import React from "react";
import Navbar from "../../../components/Navbar";
import "./CaregiverProfile.scss";
import { useEffect, useState } from "react";
import profileCardImage from "../../../assets/profilecard1.png"; // Placeholder image

const ProfilePage = () => {
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
      console.log("thi is the profile page");
    return (
        <div className="profile-page-container">
            {/* I commented this out since it overlaps with the layout and im not sure how to fix <Navbar />*/}
            {/* Left Section - Profile Details */}
            <div >
                <div className="profile-info-section">
                    <img src={profileCardImage} alt="Profile" className="profile-image" />
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-email">{profile.username}</p>
                    <div className="profile-rating">★★★★☆ (29 reviews)</div>
                    {/*I know the spaces arent the cleanest solution but they seemed the easiest if you need me to change it please let me know*/}
                    <p className="profile-location">Location                             Lagos, Nigeria</p>
                    <p className="profile-membership">Member since               20th June, 2024</p>
                </div>

                <div className="profile-stats-section">
                    <div className="stats-item">
                        <img src="https://via.placeholder.com/20" alt="icon" className="stats-icon" />
                        <p className="stats-label">Total Spent:</p>
                        <p className="stats-value">₦50,500.00</p>
                    </div>
                    <div className="stats-item">
                        <img src="https://via.placeholder.com/20" alt="icon" className="stats-icon" />
                        <p className="stats-label">No. of orders:</p>
                        <p className="stats-value">11</p>
                    </div>
                </div>

                <div className="profile-settings-section">
                    <button className="account-settings">⚙️ Account settings</button>
                </div>
            </div>
            {/* Right Section - Reviews */}
            <div className="reviews-section">
                <h2>Reviews from Caregivers</h2>
                {[...Array(5)].map((_, index) => (
                    <div className="review-card" key={index}>
                        <img src={profileCardImage} alt="Reviewer" className="reviewer-image" />
                        <div className="review-content">
                            <h3 className="reviewer-name">Josiah Ruben</h3>
                            <div className="review-rating">★★★★★</div>
                            <p className="review-text">
                                "I can't thank Ruth enough for the care and kindness she provided to my mother.
                                Her attention to detail and genuine concern for her well-being went above and beyond our expectations.
                                She always made sure he was comfortable, listened to his needs, and offered companionship."
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfilePage;