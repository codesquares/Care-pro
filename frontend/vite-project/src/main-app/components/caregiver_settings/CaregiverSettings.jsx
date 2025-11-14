import { useEffect, useState } from "react";
import "./CaregiverSettings.scss";
import { toast } from "react-toastify";
import ProfileHeader from "../../pages/care-giver/care-giver-profile/ProfileHeader";
import config from "../../config";

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

        const response = await fetch(`${config.BASE_URL}/CareGivers/${userId}`);

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
      const response = await fetch(`${config.BASE_URL}/CareGivers/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

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
      <div className="settings-content">
        <div className="caregiver-settings-profile-section">
          <ProfileHeader />
        </div>

        <div className="settings-panel">
          <div className="settings-card">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={loading ? "Loading..." : (userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : "Not provided")} 
                readOnly 
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={loading ? "Loading..." : (userData?.email || "Not provided")} 
                readOnly 
              />
            </div>
            <button className="save-changes-btn" disabled>
              Save Changes
            </button>
          </div>

          <div className="settings-card">
            <h3>Update Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <p className="password-hint">
              * 8 characters or longer. Combine upper and lowercase letters and numbers.
            </p>
            {passwordMessage && <p className="status-message">{passwordMessage}</p>}
            <button className="save-changes-btn" onClick={handlePasswordChange}>
              Save Changes
            </button>
          </div>

          <div className="settings-card">
            <h3>Account Deactivation</h3>
            <p className="deactivation-warning">
              When you deactivate your account:
            </p>
            <ul className="deactivation-list">
              <li>Your profile and gigs won't be shown on their original places.</li>
              <li>Active orders will be canceled.</li>
              <li>You won't be able to re-activate your gigs.</li>
            </ul>
            <div className="form-group">
              <label className="leaving-reason">Why are you leaving?</label>
              <select className="reason-dropdown">
                <option>Choose reason</option>
                <option>I no longer need this account</option>
                <option>I'm not satisfied with the service</option>
              </select>
            </div>
            <button className="deactivate-btn">Deactivate account</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CaregiverSettings;