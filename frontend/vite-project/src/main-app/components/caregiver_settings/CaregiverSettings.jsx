import React, { useEffect, useState } from "react";
import "./CaregiverSettings.scss";
import profileCardImage from "../../../assets/profilecard1.png"; // Placeholder image
import { toast } from "react-toastify";

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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        console.log("Profile data fetched in settings page:", data);

        setProfile({
          name: `${data.firstName} ${data.lastName}` || "N/A",
          username: data.email || "N/A",
          location: data.location || "N/A",
          memberSince: data.createdAt || "N/A",
          picture: data.profileImage || profileCardImage,
        });

        setIsAvailable(data.isAvailable);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);
// console.log("profile picture:", profile.picture);
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
      toast.success(`Status changed to ${newAvailability ? "Available" : "Unavailable"}`);
    } catch (err) {
      console.error(err.message);
    }
  };

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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview URL using FileReader (CSP-compliant)
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setProfile(prev => ({
        ...prev,
        picture: fileReader.result
      }));
    };
    fileReader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      
      if (!userDetails?.id) {
        throw new Error("User ID not found");
      }

      const formData = new FormData();
      formData.append('ProfileImage', file);

      // Determine if user is client or caregiver based on userDetails
      // You may need to adjust this logic based on how you identify user types
      const isClient = userDetails.role === 'Client' || userDetails.userType === 'Client';
      const endpoint = isClient 
        ? `https://carepro-api20241118153443.azurewebsites.net/api/Clients/UpdateProfilePicture/${userDetails.id}`
        : `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateProfilePicture/${userDetails.id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update profile picture';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result = {};
      try {
        result = await response.json();
      } catch {
        // If response is not JSON (likely a success message), that's okay
        console.log('Response is not JSON, assuming success');
      }
      
      // If API returns a new image URL, update it; otherwise keep the preview
      if (result.profilePictureUrl || result.url) {
        setProfile(prev => ({
          ...prev,
          picture: result.profilePictureUrl || result.url
        }));
      } else {
        // If no URL in response, refresh profile data to get updated picture URL
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        const refreshResponse = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.profileImage) {
            setProfile(prev => ({
              ...prev,
              picture: refreshData.profileImage
            }));
          }
        }
      }

      toast.success('Profile picture updated successfully!');
      
      // Reset the file input
      event.target.value = '';
      
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error(err.message || 'Failed to update profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerImageUpload = () => {
    document.getElementById('profile-image-input').click();
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="settings-container">
      <div className="profile-settings-wrapper">
        {/* Profile Section */}
        <div className="profile-info-section">
          <div className="profile-image-container">
            <img src={profile.picture} alt="Profile" className="profile-image" />
            <button 
              className="image-upload-button" 
              onClick={triggerImageUpload}
              disabled={isUploadingImage}
              title="Upload new profile picture"
            >
              {isUploadingImage ? '...' : '+'}
            </button>
            <input
              id="profile-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{profile.username}</p>
          <div className="profile-rating">★★★★☆ (29 reviews)</div>
          <p className="profile-location">Location: {profile.location}</p>
          <p className="profile-membership">
            Member since: {new Date(profile.memberSince).toDateString()}
          </p>
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
  );
};

export default CaregiverSettings;
