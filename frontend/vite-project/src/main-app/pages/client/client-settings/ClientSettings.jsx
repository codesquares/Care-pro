import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientSettings.css";
import defaultAvatar from "../../../../assets/profilecard1.png";

/**
 * Client Settings Page Component
 * 
 * Allows clients to:
 * - Update their account information
 * - Change their password
 * - Manage notification preferences
 * - Upload a profile picture
 * - Deactivate their account
 */
const ClientSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    text: "",
    confirmAction: () => {},
  });
  
  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    orderUpdates: true,
    serviceUpdates: true,
    promotions: false
  });
  
  // Get client information from local storage
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setIsLoading(true);
        // Get user details from local storage
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        
        // Set profile photo preview if available
        if (userDetails.profilePicture) {
          setPreviewUrl(userDetails.profilePicture);
        }
        
        // Set account form data
        setAccountForm({
          firstName: userDetails.firstName || "",
          lastName: userDetails.lastName || "",
          email: userDetails.email || "",
          phoneNumber: userDetails.phoneNumber || ""
        });
        
        // In a real application, you would fetch notification preferences from API
        // For now, we'll leave the default values
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching client info:", error);
        setMessage({
          type: "error",
          text: "Failed to load account information. Please try again later."
        });
        setIsLoading(false);
      }
    };
    
    fetchClientInfo();
  }, []);
  
  // Handle account form changes
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (setting) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Handle image selection
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  // Handle image upload click
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Upload image
  const handleImageUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploadingImage(true);
      
      // In a real application, you would upload the image to an API
      // For now, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user details in local storage with the new image URL
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      userDetails.profilePicture = previewUrl;
      localStorage.setItem("userDetails", JSON.stringify(userDetails));
      
      setMessage({
        type: "success",
        text: "Profile picture updated successfully!"
      });
      
      setUploadingImage(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({
        type: "error",
        text: "Failed to upload profile picture. Please try again later."
      });
      setUploadingImage(false);
    }
  };
  
  // Save account changes
  const handleAccountSave = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form
      if (!accountForm.firstName || !accountForm.lastName || !accountForm.email) {
        setMessage({
          type: "error",
          text: "Please fill out all required fields"
        });
        setIsLoading(false);
        return;
      }
      
      // In a real application, you would save changes via an API
      // For now, we'll update local storage
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const updatedDetails = {
        ...userDetails,
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        email: accountForm.email,
        phoneNumber: accountForm.phoneNumber
      };
      
      localStorage.setItem("userDetails", JSON.stringify(updatedDetails));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: "success",
        text: "Account information updated successfully!"
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving account changes:", error);
      setMessage({
        type: "error",
        text: "Failed to save changes. Please try again later."
      });
      setIsLoading(false);
    }
  };
  
  // Save password changes
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form
      if (!passwordForm.currentPassword || 
          !passwordForm.newPassword || 
          !passwordForm.confirmPassword) {
        setMessage({
          type: "error",
          text: "Please fill out all password fields"
        });
        setIsLoading(false);
        return;
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({
          type: "error",
          text: "New passwords do not match"
        });
        setIsLoading(false);
        return;
      }
      
      if (passwordForm.newPassword.length < 8) {
        setMessage({
          type: "error",
          text: "Password must be at least 8 characters long"
        });
        setIsLoading(false);
        return;
      }
      
      // In a real application, you would change the password via an API
      // For now, we'll simulate a successful password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: "success",
        text: "Password updated successfully!"
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({
        type: "error", 
        text: "Failed to change password. Please try again later."
      });
      setIsLoading(false);
    }
  };
  
  // Save notification preferences
  const handleNotificationSave = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, you would save notification preferences via an API
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: "success",
        text: "Notification preferences updated successfully!"
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      setMessage({
        type: "error",
        text: "Failed to save notification preferences. Please try again later."
      });
      setIsLoading(false);
    }
  };
  
  // Show deactivation confirmation modal
  const showDeactivateConfirmation = () => {
    setModalConfig({
      title: "Deactivate Account",
      text: "Are you sure you want to deactivate your account? This action cannot be undone.",
      confirmAction: handleDeactivateAccount
    });
    setShowModal(true);
  };
  
  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
      setShowModal(false);
      
      // In a real application, you would deactivate the account via an API
      // For now, we'll simulate a successful deactivation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear local storage
      localStorage.removeItem("userDetails");
      localStorage.removeItem("authToken");
      
      // Redirect to home page
      navigate("/");
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error deactivating account:", error);
      setMessage({
        type: "error",
        text: "Failed to deactivate account. Please try again later."
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="settings-container">
      <h1 className="settings-title">Account Settings</h1>
      
      {/* Message display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account Information
        </button>
        <button 
          className={`tab-button ${activeTab === "password" ? "active" : ""}`}
          onClick={() => setActiveTab("password")}
        >
          Password
        </button>
        <button 
          className={`tab-button ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notifications
        </button>
      </div>
      
      {/* Account Info Tab */}
      {activeTab === "account" && (
        <div className="settings-section">
          <div className="profile-picture-section">
            <img 
              src={previewUrl || defaultAvatar} 
              alt="Profile" 
              className="profile-picture-preview"
            />
            <div className="profile-picture-actions">
              <button 
                className="settings-button"
                onClick={handleImageUploadClick}
                disabled={uploadingImage}
              >
                {uploadingImage ? "Uploading..." : "Change Picture"}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="file-input"
                accept="image/*"
                onChange={handleImageSelect}
              />
              {selectedFile && (
                <button 
                  className="settings-button"
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                >
                  Upload
                </button>
              )}
            </div>
          </div>
          
          <form className="settings-form" onSubmit={handleAccountSave}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input 
                type="text"
                id="firstName"
                name="firstName"
                value={accountForm.firstName}
                onChange={handleAccountChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text"
                id="lastName"
                name="lastName"
                value={accountForm.lastName}
                onChange={handleAccountChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email"
                id="email"
                name="email"
                value={accountForm.email}
                onChange={handleAccountChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input 
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={accountForm.phoneNumber}
                onChange={handleAccountChange}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="settings-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
          
          <div className="deactivate-section">
            <h3>Deactivate Account</h3>
            <p>Once you deactivate your account, all your data will be permanently deleted.</p>
            <button 
              className="settings-button danger"
              onClick={showDeactivateConfirmation}
              disabled={isLoading}
            >
              Deactivate Account
            </button>
          </div>
        </div>
      )}
      
      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="settings-section">
          <form className="settings-form" onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input 
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input 
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="settings-button"
                disabled={isLoading}
              >
                {isLoading ? "Changing Password..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="settings-section">
          <div className="notification-settings">
            <div className="switch-container">
              <div>
                <div className="switch-label">Email Notifications</div>
                <div className="switch-description">
                  Receive email notifications about account updates and service information
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.emailNotifications}
                  onChange={() => handleNotificationToggle("emailNotifications")}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="switch-container">
              <div>
                <div className="switch-label">SMS Notifications</div>
                <div className="switch-description">
                  Receive text messages for important updates and reminders
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.smsNotifications}
                  onChange={() => handleNotificationToggle("smsNotifications")}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="switch-container">
              <div>
                <div className="switch-label">Marketing Emails</div>
                <div className="switch-description">
                  Receive promotional emails about new services and special offers
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.marketingEmails}
                  onChange={() => handleNotificationToggle("marketingEmails")}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="switch-container">
              <div>
                <div className="switch-label">Order Updates</div>
                <div className="switch-description">
                  Receive notifications about your orders and bookings
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.orderUpdates}
                  onChange={() => handleNotificationToggle("orderUpdates")}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="switch-container">
              <div>
                <div className="switch-label">Service Updates</div>
                <div className="switch-description">
                  Receive notifications about service changes and important information
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.serviceUpdates}
                  onChange={() => handleNotificationToggle("serviceUpdates")}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="switch-container">
              <div>
                <div className="switch-label">Promotions</div>
                <div className="switch-description">
                  Receive notifications about discounts and promotional offers
                </div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationPreferences.promotions}
                  onChange={() => handleNotificationToggle("promotions")}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="settings-button"
              onClick={handleNotificationSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modalConfig.title}</h3>
            <p>{modalConfig.text}</p>
            <div className="modal-actions">
              <button 
                className="settings-button cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="settings-button danger"
                onClick={modalConfig.confirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSettings;
