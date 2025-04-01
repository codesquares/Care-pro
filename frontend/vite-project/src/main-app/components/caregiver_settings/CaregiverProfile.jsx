import React from "react";
import Navbar from "../../../components/Navbar";
import "./CaregiverProfile.scss";

const ProfilePage = () => {
    return (
        <div className="profile-page-container">
            {/* I commented this out since it overlaps with the layout and im not sure how to fix <Navbar />*/}
            {/* Left Section - Profile Details */}
            <div >
                <div className="profile-info-section">
                    <img src="https://via.placeholder.com/100" alt="Profile" className="profile-image" />
                    <h2 className="profile-name">John Manfredi</h2>
                    <p className="profile-email">@johnmanfredi20</p>
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
                        <img src="https://via.placeholder.com/50" alt="Reviewer" className="reviewer-image" />
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