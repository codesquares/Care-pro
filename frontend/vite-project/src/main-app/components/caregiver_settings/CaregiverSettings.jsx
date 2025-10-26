import { useEffect, useState } from "react";
import "./CaregiverSettings.scss";
import { toast } from "react-toastify";
import ProfileHeader from "../../pages/care-giver/care-giver-profile/ProfileHeader";

const CaregiverSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        const userId = userDetails?.id;

        if (!userId) {
          toast.error("User not found. Please log in again.");
          return;
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userId}`
        );

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          toast.error("Failed to load user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error loading user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePasswordChange = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const email = userDetails?.email;

    if (!email) {
      setPasswordMessage("User email not found.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update password");
      }

      setPasswordMessage("Password updated successfully.");
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordMessage(`Error: ${err.message}`);
    }
  };

  return (
    <>
      {/* <div className="settings-page-header-text">
        <h1 className="settings-title">My Settings</h1>
      </div> */}
      
      <div className="settings-content">
        {/* Profile Section - Using ProfileHeader component */}
        <div className="caregiver-settings-profile-section">
          <ProfileHeader />
        </div>

        {/* Settings Section */}
        <div className="settings-panel">
        {/* Profile Info */}
        <div className="settings-box">
          <h3>Full Name</h3>
          <input 
            type="text" 
            value={loading ? "Loading..." : (userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : "Not provided")} 
            readOnly 
          />
          <h3>Email</h3>
          <input 
            type="email" 
            value={loading ? "Loading..." : (userData?.email || "Not provided")} 
            readOnly 
          />
          <h3>Account Status</h3>
          <div className="status-buttons">
            <button
              className="available"
              onClick={() => console.log('Available')}
              disabled={false}
            >
              Available
            </button>
            <button
              className="inactive"
              onClick={() => console.log('Unavailable')}
              disabled={false}
            >
              Unavailable
            </button>
          </div>
          <button className="save-button" disabled>
            Save Changes
          </button>
        </div>

        {/* Update Password */}
        <div className="settings-box">
          <h3>Update Password</h3>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          <p className="password-hint">
            * 8 characters or longer. Combine upper and lowercase letters and numbers.
          </p>
          {passwordMessage && <p className="status-message">{passwordMessage}</p>}
          <button className="save-button" onClick={handlePasswordChange}>
            Save Changes
          </button>
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
    </>
  );
};

export default CaregiverSettings;
