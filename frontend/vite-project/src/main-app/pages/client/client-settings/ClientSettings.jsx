import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientSettings.scss";
import ClientProfileHeader from "./ClientProfileHeader";
import ClientSettingsService from "../../../services/ClientSettingsService";
import AddressInput from "../../../components/AddressInput";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

/**
 * Enhanced Client Settings Page Component - Hybrid Design
 * 
 * Allows clients to:
 * - Update their account information
 * - Change their password
 * - Manage notification preferences
 * - Update their location
 * - Deactivate their account
 */
const ClientSettings = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
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
  
  // Deactivation reason state
  const [deactivationReason, setDeactivationReason] = useState("");
  
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

  // Address form state
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: ""
  });

  // Address validation state
  const [addressValidation, setAddressValidation] = useState(null);

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
        
        // Set account form data
        setAccountForm({
          firstName: userDetails.firstName || "",
          lastName: userDetails.lastName || "",
          email: userDetails.email || "",
          phoneNumber: userDetails.phoneNumber || ""
        });

        // Set address form data
        setAddressForm({
          address: userDetails.address || "",
          city: userDetails.city || "",
          state: userDetails.state || "",
          country: userDetails.country || "",
          postalCode: userDetails.postalCode || ""
        });

        // Load notification preferences from API
        if (userDetails.id) {
          try {
            const preferencesResponse = await ClientSettingsService.getNotificationPreferences(userDetails.id);
            if (preferencesResponse.success && preferencesResponse.data) {
              setNotificationPreferences(preferencesResponse.data);
            }
          } catch (error) {
            console.warn("Failed to load notification preferences, using defaults:", error);
            // Keep default preferences if API call fails
          }
        }
        
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

  // Handle address change
  const handleAddressChange = (address) => {
    setAddressForm(prev => ({
      ...prev,
      address: address
    }));
  };

  // Handle address validation
  const handleAddressValidation = (validation) => {
    setAddressValidation(validation);
    
    // Update address form with validated components if available
    if (validation && validation.addressComponents) {
      const components = validation.addressComponents;
      setAddressForm(prev => ({
        ...prev,
        city: components.city || prev.city,
        state: components.state || prev.state,
        country: components.country || prev.country,
        postalCode: components.postalCode || prev.postalCode
      }));
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
      
      // Update AuthContext with new data
      updateUser({
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        phoneNumber: accountForm.phoneNumber
      });
      
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
      text: "Please correct the errors in the form",
    });
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    setValidationStates((prev) => ({
      ...prev,
      confirmPassword: { isValid: false, message: "Passwords don't match" },
    }));
    setMessage({
      type: "error",
      text: "New passwords do not match",
    });
    return;
  }

  if (passwordStrength.score < 3) {
    setMessage({
      type: "error",
      text: "Please choose a stronger password",
    });
    return;
  }

  try {
    setIsLoading(true);
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");

    // ✅ Real API call here
    const payload = {
      email: userDetails.email, // <-- replace with how you access current user email
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    };

    const res = await ClientSettingsService.changePassword(payload);

    setMessage({
      type: "success",
      text: "Password updated successfully!",
    });

    // Reset password form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setPasswordStrength({
      score: 0,
      label: "Very Weak",
      color: "#f85c70",
    });

  } catch (error) {
    console.error("Error changing password:", error);
    setMessage({
      type: "error",
      text:
        error?.response?.data?.message ||
        error.message ||
        "Failed to change password. Please try again later.",
    });
  } finally {
    setIsLoading(false);
  }
};

  
  // Save notification preferences
  const handleNotificationSave = async () => {
    try {
      setIsLoading(true);
      
      // Get client ID from localStorage
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      if (!userDetails.id) {
        setMessage({
          type: "error",
          text: "Unable to identify user. Please log in again."
        });
        setIsLoading(false);
        return;
      }

      // Call API to update notification preferences
      const response = await ClientSettingsService.updateNotificationPreferences(
        userDetails.id, 
        notificationPreferences
      );

      if (response.success) {
        setMessage({
          type: "success",
          text: response.message || "Notification preferences updated successfully!"
        });

        // Update local state with response data if provided
        if (response.data) {
          setNotificationPreferences(response.data);
        }
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to save notification preferences"
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save notification preferences. Please try again later."
      });
      setIsLoading(false);
    }
  };

  // Save address changes
  const handleAddressSave = async (e) => {
    e.preventDefault();
    
    // Validate that address is provided
    if (!addressForm.address || addressForm.address.trim() === "") {
      setMessage({
        type: "error",
        text: "Please enter a valid address"
      });
      return;
    }

    // Check if address is validated by Google Maps
    if (!addressValidation || !addressValidation.isValid) {
      setMessage({
        type: "error",
        text: "Please select a valid address from the suggestions"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      
      // Use the formatted address if available from Google validation
      const addressToSend = addressValidation?.formattedAddress || addressForm.address;
      
      // Update address via API - only send homeAddress, backend handles geocoding
      const response = await ClientSettingsService.updateClientAddress(userDetails.id, addressToSend);

      if (response.success) {
        // Extract location data from response
        const locationData = response.data?.data || response.data;
        const cityName = locationData?.city || addressValidation?.addressComponents?.city || 'location';
        
        setMessage({
          type: "success",
          text: `Address updated successfully! Now serving in ${cityName}.`
        });
        
        // Update AuthContext with new address and location data
        updateUser({ 
          homeAddress: addressToSend,
          address: addressToSend,
          serviceCity: locationData?.city || addressValidation?.addressComponents?.city,
          serviceState: locationData?.state || addressValidation?.addressComponents?.state,
          location: addressToSend
        });
        
        // Reload user data from localStorage (which should be updated by the API response)
        const refreshedDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        setAddressForm({
          address: refreshedDetails.address || refreshedDetails.homeAddress || "",
          city: refreshedDetails.city || locationData?.city || "",
          state: refreshedDetails.state || locationData?.state || "",
          country: refreshedDetails.country || locationData?.country || "",
          postalCode: refreshedDetails.postalCode || ""
        });
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to update address"
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving address:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save address. Please try again later."
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

  return (
    <div className="settings-content">
      {/* Message display */}
      {message.text && (
        <div className={`status-message ${message.type === 'error' ? 'error' : ''}`}>
          {message.text}
        </div>
      )}

      {/* Left Section - Profile Header */}
      <div className="client-settings-profile-section">
        <ClientProfileHeader />
      </div>
      
      {/* Right Section - Settings Cards */}
      <div className="settings-panel">
        {/* Personal Information Card */}
        <div className="settings-card">
          <h3>Personal Information</h3>
          <form onSubmit={handleAccountSave}>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text"
                name="firstName"
                value={accountForm.firstName}
                onChange={handleAccountChange}
              />
              {!validationStates.firstName.isValid && (
                <span className="validation-message error">{validationStates.firstName.message}</span>
              )}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text"
                name="lastName"
                value={accountForm.lastName}
                onChange={handleAccountChange}
              />
              {!validationStates.lastName.isValid && (
                <span className="validation-message error">{validationStates.lastName.message}</span>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email"
                value={accountForm.email}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel"
                name="phoneNumber"
                value={accountForm.phoneNumber}
                onChange={handleAccountChange}
              />
              {!validationStates.phoneNumber.isValid && (
                <span className="validation-message error">{validationStates.phoneNumber.message}</span>
              )}
            </div>
            <button 
              type="submit" 
              className="save-changes-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Update Password Card */}
        <div className="settings-card">
          <h3>Update Password</h3>
          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
              {!validationStates.currentPassword.isValid && (
                <span className="validation-message error">{validationStates.currentPassword.message}</span>
              )}
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
              {passwordForm.newPassword && (
                <div className="password-strength-indicator">
                  <div 
                    className="password-strength-bar" 
                    style={{ 
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                  <span 
                    className="password-strength-text" 
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              {!validationStates.newPassword.isValid && (
                <span className="validation-message error">{validationStates.newPassword.message}</span>
              )}
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
              {!validationStates.confirmPassword.isValid && (
                <span className="validation-message error">{validationStates.confirmPassword.message}</span>
              )}
            </div>
            <p className="password-hint">
              * 8 characters or longer. Combine upper and lowercase letters and numbers.
            </p>
            <button 
              type="submit" 
              className="save-changes-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Care Preferences Card */}
        <div className="settings-card">
          <h3>Care Preferences</h3>
          <p className="card-description">
            Set your care preferences to get personalized caregiver recommendations
          </p>
          <button 
            type="button"
            className="save-changes-btn"
            onClick={() => navigate('/app/client/preferences')}
          >
            Manage Care Preferences
          </button>
        </div>

        {/* Notification Preferences Card */}
        <div className="settings-card">
          <h3>Notification Preferences</h3>
          <div className="notification-options">
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">Email Notifications</span>
                <span className="notification-description">Receive updates via email</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.emailNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('emailNotifications')}
              />
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">SMS Notifications</span>
                <span className="notification-description">Receive updates via SMS</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.smsNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('smsNotifications')}
              />
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">Marketing Emails</span>
                <span className="notification-description">Receive promotional content</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.marketingEmails ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('marketingEmails')}
              />
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">Order Updates</span>
                <span className="notification-description">Get notified about order status</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.orderUpdates ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('orderUpdates')}
              />
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">Service Updates</span>
                <span className="notification-description">Updates about services you use</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.serviceUpdates ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('serviceUpdates')}
              />
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-title">Promotions</span>
                <span className="notification-description">Special offers and deals</span>
              </div>
              <button
                type="button"
                className={`notification-toggle ${notificationPreferences.promotions ? 'active' : ''}`}
                onClick={() => handleNotificationToggle('promotions')}
              />
            </div>
          </div>
          <button 
            type="button"
            className="save-changes-btn"
            onClick={handleNotificationSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Service Address Card */}
        <div className="settings-card">
          <h3>Service Address</h3>
          <form onSubmit={handleAddressSave}>
            <div className="form-group">
              <label>Full Address</label>
              <AddressInput
                value={addressForm.address}
                onChange={handleAddressChange}
                onValidation={handleAddressValidation}
                placeholder="Enter your full address"
                showValidationIcon={true}
                autoValidate={true}
                country="ng"
              />
              {addressValidation && !addressValidation.isValid && (
                <span className="validation-message error">
                  {addressValidation.errorMessage || 'Please enter a valid address'}
                </span>
              )}
              {addressValidation && addressValidation.isValid && addressValidation.isGoogleValidated && (
                <span className="validation-message success">
                  ✓ Address verified by Google Maps
                </span>
              )}
            </div>
            
            {addressValidation && addressValidation.isValid && addressForm.city && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginTop: '16px'
              }}>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text"
                    value={addressForm.city}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text"
                    value={addressForm.state}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>Country</label>
                  <input 
                    type="text"
                    value={addressForm.country}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>Postal Code</label>
                  <input 
                    type="text"
                    value={addressForm.postalCode}
                    readOnly
                  />
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="save-changes-btn"
              disabled={isLoading || !addressValidation?.isValid}
            >
              {isLoading ? 'Saving...' : 'Save Location'}
            </button>
          </form>
        </div>

        {/* Account Deactivation Card */}
        <div className="settings-card">
          <h3>Account Deactivation</h3>
          <p className="deactivation-warning">
            When you deactivate your account:
          </p>
          <ul className="deactivation-list">
            <li>Your profile won't be visible to caregivers.</li>
            <li>Active bookings will be canceled.</li>
            <li>You won't be able to re-activate your account.</li>
            <li>All your data will be permanently deleted.</li>
          </ul>
          <div className="form-group">
            <label className="leaving-reason">Why are you leaving?</label>
            <select 
              className="reason-dropdown"
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
            >
              <option value="">Choose reason</option>
              <option value="no-longer-need">I no longer need this account</option>
              <option value="not-satisfied">I'm not satisfied with the service</option>
              <option value="privacy-concerns">Privacy concerns</option>
              <option value="found-alternative">Found an alternative service</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button 
            type="button"
            className="deactivate-btn"
            onClick={showDeactivateConfirmation}
          >
            Deactivate account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="client-location-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="client-location-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalConfig.title}</h3>
            <p>{modalConfig.text}</p>
            <div className="client-modal-buttons">
              <button 
                className="client-modal-btn client-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="client-modal-btn client-modal-save"
                style={{ backgroundColor: '#ef4444' }}
                onClick={modalConfig.confirmAction}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSettings;
