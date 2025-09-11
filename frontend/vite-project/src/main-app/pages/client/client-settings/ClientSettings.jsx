import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientSettings.css";
import defaultAvatar from "../../../../assets/profilecard1.png";

/**
 * Enhanced Premium Client Settings Page Component
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle
  
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
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Very Weak",
    color: "#f85c70"
  });
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    orderUpdates: true,
    serviceUpdates: true,
    promotions: false
  });

  // Field validation states
  const [validationStates, setValidationStates] = useState({
    firstName: { isValid: true, message: "" },
    lastName: { isValid: true, message: "" },
    email: { isValid: true, message: "" },
    phoneNumber: { isValid: true, message: "" },
    currentPassword: { isValid: true, message: "" },
    newPassword: { isValid: true, message: "" },
    confirmPassword: { isValid: true, message: "" }
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

  // Display messages for a limited time
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate phone number format
  const validatePhone = (phone) => {
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phone === "" || re.test(String(phone));
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    // Simple password strength check
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Return score and label
    let label, color;
    switch(true) {
      case (score <= 2):
        label = "Very Weak";
        color = "#f85c70";
        break;
      case (score <= 3):
        label = "Weak";
        color = "#ffa500";
        break;
      case (score <= 4):
        label = "Medium";
        color = "#ffca28";
        break;
      case (score <= 5):
        label = "Strong";
        color = "#8bc34a";
        break;
      default:
        label = "Very Strong";
        color = "#20c997";
    }
    
    return { score, label, color };
  };
  
  // Handle account form changes
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
    
    // Validate fields as user types
    validateField(name, value);
  };

  // Validate individual field
  const validateField = (name, value) => {
    let isValid = true;
    let message = "";
    
    switch (name) {
      case "firstName":
      case "lastName":
        isValid = value.trim() !== "";
        message = isValid ? "" : "This field is required";
        break;
      case "email":
        isValid = validateEmail(value);
        message = isValid ? "" : "Please enter a valid email address";
        break;
      case "phoneNumber":
        isValid = validatePhone(value);
        message = isValid ? "" : "Please enter a valid phone number";
        break;
      case "newPassword":
        const strength = checkPasswordStrength(value);
        setPasswordStrength(strength);
        isValid = value.length >= 8;
        message = isValid ? "" : "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        isValid = value === passwordForm.newPassword;
        message = isValid ? "" : "Passwords don't match";
        break;
      default:
        break;
    }
    
    setValidationStates(prev => ({
      ...prev,
      [name]: { isValid, message }
    }));
    
    return isValid;
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (name === "newPassword") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
      
      // Also validate confirmPassword if it exists
      if (passwordForm.confirmPassword) {
        validateField("confirmPassword", passwordForm.confirmPassword);
      }
    }
    
    validateField(name, value);
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
  
  // Upload image with simulated progress
  const handleImageUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const intervalId = setInterval(() => {
        setUploadProgress(prevProgress => {
          const newProgress = prevProgress + 5;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 100);
      
      // In a real application, you would upload the image to an API
      // For now, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(intervalId);
      setUploadProgress(100);
      
      // Update user details in local storage with the new image URL
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      userDetails.profilePicture = previewUrl;
      localStorage.setItem("userDetails", JSON.stringify(userDetails));
      
      setMessage({
        type: "success",
        text: "Profile picture updated successfully!"
      });
      
      // Small delay before resetting upload state
      setTimeout(() => {
        setUploadingImage(false);
        setSelectedFile(null);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({
        type: "error",
        text: "Failed to upload profile picture. Please try again later."
      });
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };
  
  // Save account changes
  const handleAccountSave = async (e) => {
    e.preventDefault();
    
    // Validate editable fields
    const firstNameValid = validateField("firstName", accountForm.firstName);
    const lastNameValid = validateField("lastName", accountForm.lastName);
    const phoneValid = validateField("phoneNumber", accountForm.phoneNumber);
    
    if (!firstNameValid || !lastNameValid || !phoneValid) {
      setMessage({
        type: "error",
        text: "Please correct the errors in the form"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real application, you would save changes via an API
      // For now, we'll update local storage
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const updatedDetails = {
        ...userDetails,
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        // email is read-only and remains unchanged
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
    
    // Validate password fields
    const currentPasswordValid = validateField("currentPassword", passwordForm.currentPassword);
    const newPasswordValid = validateField("newPassword", passwordForm.newPassword);
    const confirmPasswordValid = validateField("confirmPassword", passwordForm.confirmPassword);
    
    if (!currentPasswordValid || !newPasswordValid || !confirmPasswordValid) {
      setMessage({
        type: "error",
        text: "Please correct the errors in the form"
      });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setValidationStates(prev => ({
        ...prev,
        confirmPassword: { isValid: false, message: "Passwords don't match" }
      }));
      setMessage({
        type: "error",
        text: "New passwords do not match"
      });
      return;
    }
    
    if (passwordStrength.score < 3) {
      setMessage({
        type: "error",
        text: "Please choose a stronger password"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real application, you would change the password via an API
      // For now, we'll simulate a successful password change
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      
      setPasswordStrength({
        score: 0,
        label: "Very Weak",
        color: "#f85c70"
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
      text: "Are you sure you want to deactivate your account? This action cannot be undone and all your data will be permanently deleted.",
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

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="client-settings-container">
      {/* Mobile toggle button */}
      <div className="client-settings-mobile-toggle-button" onClick={toggleSidebar}>
        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </div>
      
      <div className="client-settings-layout">
        {/* Left Sidebar */}
        <div className={`client-settings-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="client-settings-sidebar-header">
            <img src={previewUrl || defaultAvatar} alt="Profile" className="client-settings-sidebar-avatar" />
            <div className="client-settings-sidebar-user-info">
              <h3>{`${accountForm.firstName} ${accountForm.lastName}`}</h3>
              <p>{accountForm.email}</p>
            </div>
          </div>
          
          <ul className="client-settings-sidebar-menu">
            <li 
              className={`client-settings-sidebar-menu-item ${activeTab === "account" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("account");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-user-circle"></i>
              <span>Account Information</span>
            </li>
            <li 
              className={`client-settings-sidebar-menu-item ${activeTab === "password" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("password");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-lock"></i>
              <span>Password</span>
            </li>
            <li 
              className={`client-settings-sidebar-menu-item ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("notifications");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-bell"></i>
              <span>Notifications</span>
            </li>
          </ul>
        </div>
        
        {/* Main Content Area */}
        <div className="client-settings-content">
          <h1 className="client-settings-title">
            {activeTab === "account" && "Account Information"}
            {activeTab === "password" && "Change Password"}
            {activeTab === "notifications" && "Notification Preferences"}
          </h1>
          
          {/* Message display */}
          {message.text && (
            <div className={`client-settings-message ${message.type}`}>
              {message.text}
            </div>
          )}
      
          {/* Account Info Tab */}
          {activeTab === "account" && (
            <div className="client-settings-section">
              <div className="client-settings-profile-picture-section">
                <img 
                  src={previewUrl || defaultAvatar} 
                  alt="Profile" 
                  className="client-settings-profile-picture-preview"
                />
                <div className="client-settings-profile-picture-actions">
                  <button 
                    className="client-settings-button"
                    onClick={handleImageUploadClick}
                    disabled={uploadingImage}
                  >
                    <i className="fas fa-camera"></i> {uploadingImage ? "Uploading..." : "Change Picture"}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="client-settings-file-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  {selectedFile && (
                    <>
                      {uploadingImage ? (
                        <div className="client-settings-upload-progress">
                          <div 
                            className="client-settings-progress-bar" 
                            style={{ 
                              width: `${uploadProgress}%`,
                              backgroundColor: uploadProgress < 100 ? '#4a6bdf' : '#20c997'
                            }}
                          ></div>
                          <span className="client-settings-progress-text">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <button 
                          className="client-settings-button"
                          onClick={handleImageUpload}
                        >
                          <i className="fas fa-cloud-upload-alt"></i> Upload
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <form className="client-settings-form" onSubmit={handleAccountSave}>
                <div className="client-settings-form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input 
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={accountForm.firstName}
                    onChange={handleAccountChange}
                    className={`client-settings-input-validated ${
                      accountForm.firstName && 
                      (validationStates.firstName.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  {accountForm.firstName && validationStates.firstName.isValid && (
                    <i className="fas fa-check client-settings-validation-icon"></i>
                  )}
                  {!validationStates.firstName.isValid && (
                    <p className="client-settings-password-hint">{validationStates.firstName.message}</p>
                  )}
                </div>
                
                <div className="client-settings-form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={accountForm.lastName}
                    onChange={handleAccountChange}
                    className={`client-settings-input-validated ${
                      accountForm.lastName && 
                      (validationStates.lastName.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  {accountForm.lastName && validationStates.lastName.isValid && (
                    <i className="fas fa-check client-settings-validation-icon"></i>
                  )}
                  {!validationStates.lastName.isValid && (
                    <p className="client-settings-password-hint">{validationStates.lastName.message}</p>
                  )}
                </div>
                
                <div className="client-settings-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email"
                    id="email"
                    name="email"
                    value={accountForm.email}
                    className="client-settings-input-readonly"
                    readOnly
                    disabled
                  />
                  <p className="client-settings-field-info">
                    <i className="fas fa-info-circle"></i> Email address cannot be changed
                  </p>
                </div>
                
                <div className="client-settings-form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input 
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={accountForm.phoneNumber}
                    onChange={handleAccountChange}
                    className={`client-settings-input-validated ${
                      accountForm.phoneNumber && 
                      (validationStates.phoneNumber.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  {accountForm.phoneNumber && validationStates.phoneNumber.isValid && (
                    <i className="fas fa-check client-settings-validation-icon"></i>
                  )}
                  {!validationStates.phoneNumber.isValid && (
                    <p className="client-settings-password-hint">{validationStates.phoneNumber.message}</p>
                  )}
                </div>
                
                <div className="client-settings-form-actions">
                  <button 
                    type="submit" 
                    className="client-settings-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="client-settings-deactivate-section">
                <h3><i className="fas fa-exclamation-triangle"></i> Deactivate Account</h3>
                <p>Once you deactivate your account, all your data will be permanently deleted. This action cannot be undone.</p>
                <div className="right-aligned">
                  <button 
                    className="client-settings-button danger"
                    onClick={showDeactivateConfirmation}
                    disabled={isLoading}
                  >
                    <i className="fas fa-user-slash"></i> Deactivate Account
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="client-settings-section">
              <form className="client-settings-form" onSubmit={handlePasswordSave}>
                <div className="client-settings-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input 
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`client-settings-input-validated ${
                      passwordForm.currentPassword && 
                      (validationStates.currentPassword.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  {!validationStates.currentPassword.isValid && (
                    <p className="client-settings-password-hint">{validationStates.currentPassword.message}</p>
                  )}
                </div>
                
                <div className="client-settings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input 
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={`client-settings-input-validated ${
                      passwordForm.newPassword && 
                      (validationStates.newPassword.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  
                  {passwordForm.newPassword && (
                    <div className="client-settings-password-strength">
                      <div className="client-settings-strength-bar" style={{ width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }}></div>
                      <span className="client-settings-strength-text" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  
                  <p className="client-settings-password-hint">
                    <i className="fas fa-info-circle"></i> Password should be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>
                
                <div className="client-settings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input 
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`client-settings-input-validated ${
                      passwordForm.confirmPassword && 
                      (validationStates.confirmPassword.isValid ? "valid" : "invalid")
                    }`}
                    required
                  />
                  {!validationStates.confirmPassword.isValid && (
                    <p className="client-settings-password-hint">{validationStates.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="client-settings-form-actions">
                  <button 
                    type="submit" 
                    className="client-settings-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Changing Password...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-key"></i> Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="client-settings-section">
              <div className="client-settings-notification-settings">
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">Email Notifications</div>
                    <div className="client-settings-switch-description">
                      Receive email notifications about account updates and service information
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.emailNotifications}
                      onChange={() => handleNotificationToggle("emailNotifications")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
                
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">SMS Notifications</div>
                    <div className="client-settings-switch-description">
                      Receive text messages for important updates and reminders
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.smsNotifications}
                      onChange={() => handleNotificationToggle("smsNotifications")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
                
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">Marketing Emails</div>
                    <div className="client-settings-switch-description">
                      Receive promotional emails about new services and special offers
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.marketingEmails}
                      onChange={() => handleNotificationToggle("marketingEmails")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
                
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">Order Updates</div>
                    <div className="client-settings-switch-description">
                      Receive notifications about your orders and bookings
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.orderUpdates}
                      onChange={() => handleNotificationToggle("orderUpdates")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
                
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">Service Updates</div>
                    <div className="client-settings-switch-description">
                      Receive notifications about service changes and important information
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.serviceUpdates}
                      onChange={() => handleNotificationToggle("serviceUpdates")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
                
                <div className="client-settings-switch-container">
                  <div>
                    <div className="client-settings-switch-label">Promotions</div>
                    <div className="client-settings-switch-description">
                      Receive notifications about discounts and promotional offers
                    </div>
                  </div>
                  <label className="client-settings-switch">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.promotions}
                      onChange={() => handleNotificationToggle("promotions")}
                    />
                    <span className="client-settings-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="client-settings-form-actions">
                <button 
                  className="client-settings-button"
                  onClick={handleNotificationSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showModal && (
        <div className="client-settings-modal-overlay">
          <div className="client-settings-modal-content">
            <h3><i className="fas fa-exclamation-triangle"></i> {modalConfig.title}</h3>
            <p>{modalConfig.text}</p>
            <div className="client-settings-modal-actions">
              <button 
                className="client-settings-button cancel"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button 
                className="client-settings-button danger"
                onClick={modalConfig.confirmAction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSettings;
