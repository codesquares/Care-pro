
import Navbar from "../../../components/Navbar";
import "./CaregiverProfile.css";
import { useEffect, useState } from "react";
import profileCardImage from "../../../assets/profilecard1.png"; // Placeholder image
import config from "../../config"; // Import centralized config for API URLs

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        name: "",
    
        location: "",
        memberSince: "",
        // username: "", // TODO: Backend persistence not implemented yet
        
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
            // Use centralized config instead of hardcoded URL for consistent API routing
            const response = await fetch(
              `${config.BASE_URL}/CareGivers/${userDetails.id}`
            );
            
    
            if (!response.ok) {
              throw new Error("Failed to fetch profile data.");
            }
    
            const data = await response.json();
            console.log(data);
    
            // Map API response to the state
            setProfile({
              name: `${data.firstName} ${data.lastName}` || "N/A", // Use firstName and lastName if available, otherwise use "N/A"data.firstName || "N/A",
              // username: data.email || "N/A", // TODO: Backend persistence not implemented yet
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
        <div className="cgp-page-container">
            
            {/* Left Section - Profile Details */}
            <div >
                <div className="cgp-info-section">
                    <img src={profileCardImage} alt="Profile" className="cgp-profile-image" />
                    <h2 className="cgp-profile-name">{profile.name}</h2>
                    {/* <p className="cgp-profile-email">{profile.username}</p> */} {/* TODO: Backend persistence not implemented yet */}
                    <div className="cgp-profile-rating">★★★★☆ (29 reviews)</div>
                    {/*I know the spaces arent the cleanest solution but they seemed the easiest if you need me to change it please let me know*/}
                    <p className="cgp-profile-location">Location                             {profile.location}</p>
                    <p className="cgp-profile-membership">Member since               {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                </div>

                <div className="cgp-stats-section">
                    <div className="cgp-stats-item">
                        <img src="https://via.placeholder.com/20" alt="icon" className="cgp-stats-icon" />
                        <p className="cgp-stats-label">Total Spent:</p>
                        <p className="cgp-stats-value">₦50,500.00</p>
                    </div>
                    <div className="cgp-stats-item">
                        <img src="https://via.placeholder.com/20" alt="icon" className="cgp-stats-icon" />
                        <p className="cgp-stats-label">No. of orders:</p>
                        <p className="cgp-stats-value">11</p>
                    </div>
                </div>

                <div className="cgp-settings-section">
                    <button className="cgp-account-settings">⚙️ Account settings</button>
                </div>
                
                {/* Messages Section */}
                <div className="cgp-messages-section">
                    <h2>Messages</h2>
                    <div className="cgp-messages-preview">
                        <p>View your conversations with clients</p>
                        <button className="cgp-view-messages-btn" onClick={() => window.location.href = "/app/caregiver/message"}>View All Messages</button>
                    </div>
                </div>
            </div>
            {/* Right Section - Reviews */}
            <div className="cgp-reviews-section">
                <h2>Reviews from Caregivers</h2>
                {[...Array(5)].map((_, index) => (
                    <div className="cgp-review-card" key={index}>
                        <img src={profileCardImage} alt="Reviewer" className="cgp-reviewer-image" />
                        <div className="cgp-review-content">
                            <h3 className="cgp-reviewer-name">Josiah Ruben</h3>
                            <div className="cgp-review-rating">★★★★★</div>
                            <p className="cgp-review-text">
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