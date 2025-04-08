import React from "react";
import "./CaregiverSettings.scss";

const CaregiverSettings = () => {
    return (
        <div className="settings-container">
            {/* I commented this out since it overlaps with the layout and im not sure how to fix <Navbar />*/}
            <div className="profile-settings-wrapper">
                {/* Profile Section */}
                <div className="profile-info-section">
                    <img src="https://via.placeholder.com/100" alt="Profile" className="profile-image" />
                    <h2 className="profile-name">John Manfredi</h2>
                    <p className="profile-email">@johnmanfredi20</p>
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
                    <input type="text" placeholder="Ahmed Rufai" />
                    <h3>Email</h3>
                    <input type="email" placeholder="ahmedrufai@gmail.com" />
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
