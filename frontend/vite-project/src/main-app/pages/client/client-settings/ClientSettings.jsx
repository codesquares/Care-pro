import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AddressInput from "../../../components/AddressInput";
import { useAuth } from "../../../context/AuthContext";
import config from "../../../config";
import ClientSettingsService from "../../../services/ClientSettingsService";
import ClientProfileHeader from "./ClientProfileHeader";
import accountDeletionService from "../../../services/accountDeletionService";
import "./ClientSettings.css";

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
  const { updateUser, user, handleLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [authProvider, setAuthProvider] = useState("Local"); // Track auth provider

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    text: "",
    confirmAction: () => { },
  });

  // Deactivation reason state
  const [deactivationReason, setDeactivationReason] = useState("");

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelDeletionModal, setShowCancelDeletionModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteBlockers, setDeleteBlockers] = useState([]);
  const [pendingDeletionDate, setPendingDeletionDate] = useState(null);

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

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Very Weak",
    color: "#f85c70",
  });

  const [validationStates, setValidationStates] = useState({
    firstName: { isValid: true, message: "" },
    lastName: { isValid: true, message: "" },
    phoneNumber: { isValid: true, message: "" },
    currentPassword: { isValid: true, message: "" },
    newPassword: { isValid: true, message: "" },
    confirmPassword: { isValid: true, message: "" },
  });

  // Address State
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: ""
  });
  const [addressValidation, setAddressValidation] = useState(null);
  const [profileHeaderRefresh, setProfileHeaderRefresh] = useState(0);

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    orderUpdates: true,
    serviceUpdates: true,
    promotions: false
  });

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setIsLoading(true);
        // Get user details from local storage or context
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");

        // Set auth provider from user details or fetch from profile
        setAuthProvider(userDetails.authProvider || user?.authProvider || "Local");

        setAccountForm({
          firstName: userDetails.firstName || "",
          lastName: userDetails.lastName || "",
          email: userDetails.email || "",
          phoneNumber: userDetails.phoneNumber || ""
        });

        setAddressForm({
          address: userDetails.address || userDetails.homeAddress || "",
          city: userDetails.city || "",
          state: userDetails.state || "",
          country: userDetails.country || "",
          postalCode: userDetails.postalCode || ""
        });

        // Fetch the persisted address from the Location table to ensure we show the latest saved value
        if (userDetails.id) {
          try {
            const token = localStorage.getItem('authToken');
            const locResponse = await fetch(
              `${config.BASE_URL}/Location/user-location?userId=${userDetails.id}&userType=Client`,
              { headers: { 'Authorization': token ? `Bearer ${token}` : '' } }
            );
            if (locResponse.ok) {
              const locResult = await locResponse.json();
              const locData = locResult.data || locResult;
              if (locData?.address) {
                setAddressForm(prev => ({
                  ...prev,
                  address: locData.address,
                  city: locData.city || prev.city,
                  state: locData.state || prev.state,
                  country: locData.country || prev.country,
                  postalCode: locData.postalCode || prev.postalCode
                }));
                // Keep localStorage in sync with the persisted address
                updateUser({
                  homeAddress: locData.address,
                  address: locData.address,
                  ...(locData.city && { serviceCity: locData.city }),
                  ...(locData.state && { serviceState: locData.state }),
                  location: locData.address
                });
              }
            }
          } catch (locErr) {
            console.warn("Could not fetch location from Location table", locErr);
          }
        }

        if (userDetails.id) {
          try {
            const token = localStorage.getItem('authToken');
            const profileRes = await fetch(`${config.BASE_URL}/Clients/${userDetails.id}`, {
              headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData?.accountDeletionRequestedAt) {
                const deletionDate = new Date(
                  new Date(profileData.accountDeletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
                );
                setPendingDeletionDate(deletionDate);
              }
            }
          } catch (err) {
            console.warn('Could not fetch client profile for deletion status', err);
          }
        }

        if (userDetails.id) {
          try {
            const prefs = await ClientSettingsService.getNotificationPreferences(userDetails.id);
            if (prefs && prefs.data) {
              setNotificationPreferences(prev => ({ ...prev, ...prefs.data }));
            }
          } catch (err) {
            console.warn("Could not fetch notification preferences", err);
          }
        }
      } catch (error) {
        console.error("Error fetching client info:", error);
        setMessage({
          type: "error",
          text: "Failed to load account information. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientInfo();
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Validation Helpers
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label;
    let color;
    switch (true) {
      case score <= 2:
        label = "Very Weak";
        color = "#f85c70";
        break;
      case score <= 3:
        label = "Weak";
        color = "#ffa500";
        break;
      case score <= 4:
        label = "Medium";
        color = "#ffca28";
        break;
      case score <= 5:
        label = "Strong";
        color = "#8bc34a";
        break;
      default:
        label = "Very Strong";
        color = "#20c997";
    }

    return { score, label, color };
  };

  const validateField = (name, value) => {
    let isValid = true;
    let validationMessage = "";

    switch (name) {
      case "firstName":
      case "lastName":
        isValid = value.trim() !== "";
        validationMessage = isValid ? "" : "This field is required";
        break;
      case "currentPassword":
        isValid = value.trim().length > 0;
        validationMessage = isValid ? "" : "Current password is required";
        break;
      case "newPassword": {
        const strength = checkPasswordStrength(value);
        setPasswordStrength(strength);
        isValid = value.length >= 8;
        validationMessage = isValid ? "" : "Password must be at least 8 characters";
        break;
      }
      case "confirmPassword":
        isValid = value === passwordForm.newPassword;
        validationMessage = isValid ? "" : "Passwords don't match";
        break;
      default:
        break;
    }

    setValidationStates((prev) => ({
      ...prev,
      [name]: { isValid, message: validationMessage },
    }));

    return isValid;
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);

    if (name === "newPassword" && passwordForm.confirmPassword) {
      validateField("confirmPassword", passwordForm.confirmPassword);
    }
  };

  // Address Handlers
  const handleAddressChange = (address) => {
    setAddressForm(prev => ({
      ...prev,
      address: address
    }));
  };

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

  // Notification Handlers
  const handleNotificationToggle = (key) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNotificationSave = async () => {
    try {
      setIsLoading(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");

      await ClientSettingsService.updateNotificationPreferences(userDetails.id, notificationPreferences);

      setMessage({
        type: "success",
        text: "Notification preferences updated successfully!"
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update notification preferences"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Handlers
  const handleAccountSave = async (e) => {
    e.preventDefault();
    const firstNameValid = validateField("firstName", accountForm.firstName);
    const lastNameValid = validateField("lastName", accountForm.lastName);

    if (!firstNameValid || !lastNameValid) {
      setMessage({ type: "error", text: "Please correct the errors in the form" });
      return;
    }

    try {
      setIsLoading(true);
      // Update AuthContext with new data
      updateUser({
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        phoneNumber: accountForm.phoneNumber
      });

      // Also update local storage to match logic
      const stored = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const updatedDetails = {
        ...stored,
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        phoneNumber: accountForm.phoneNumber
      };
      localStorage.setItem("userDetails", JSON.stringify(updatedDetails));

      // Simulate API call delay if needed or rely on updateUser
      await new Promise(resolve => setTimeout(resolve, 800));

      setMessage({
        type: "success",
        text: "Account information updated successfully!",
      });
    } catch (error) {
      console.error("Error saving account changes:", error);
      setMessage({
        type: "error",
        text: "Failed to save changes. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    const currentPasswordValid = validateField("currentPassword", passwordForm.currentPassword);
    const newPasswordValid = validateField("newPassword", passwordForm.newPassword);
    const confirmPasswordValid = validateField("confirmPassword", passwordForm.confirmPassword);

    if (!currentPasswordValid || !newPasswordValid || !confirmPasswordValid) {
      setMessage({ type: "error", text: "Please correct the errors in the form" });
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
      const stored = JSON.parse(localStorage.getItem("userDetails") || "{}");

      const payload = {
        email: stored.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      };

      await ClientSettingsService.changePassword(payload);

      setMessage({
        type: "success",
        text: "Password updated successfully!",
      });

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
        text: error?.response?.data?.message || error.message || "Failed to change password."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");

      // Use the formatted address if available from Google validation
      const addressToSend = addressValidation?.formattedAddress || addressForm.address;

      // Update address via API — include GPS coordinates if available from validation
      const response = await ClientSettingsService.updateClientAddress(
        userDetails.id,
        addressToSend,
        addressValidation?.coordinates
      );

      if (response.success) {
        // Extract location data from response
        const locationData = response.data?.data || response.data;
        const cityName = locationData?.city || addressValidation?.addressComponents?.city || 'your location';

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

        // Update local storage
        const refreshedDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        const newDetails = {
          ...refreshedDetails,
          address: addressToSend,
          homeAddress: addressToSend,
          city: locationData?.city || addressValidation?.addressComponents?.city || refreshedDetails.city,
          state: locationData?.state || addressValidation?.addressComponents?.state || refreshedDetails.state,
          country: locationData?.country || addressValidation?.addressComponents?.country || refreshedDetails.country,
          postalCode: locationData?.postalCode || addressValidation?.addressComponents?.postalCode || refreshedDetails.postalCode
        };
        localStorage.setItem("userDetails", JSON.stringify(newDetails));

        setAddressForm({
          address: newDetails.address || "",
          city: newDetails.city || "",
          state: newDetails.state || "",
          country: newDetails.country || "",
          postalCode: newDetails.postalCode || ""
        });

        // Tell ClientProfileHeader to re-fetch so the "show" link updates
        setProfileHeaderRefresh(prev => prev + 1);
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to update address"
        });
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save address. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showDeactivateConfirmation = () => {
    if (!deactivationReason) {
      setMessage({
        type: "error",
        text: "Please choose a reason before deactivating.",
      });
      return;
    }

    setModalConfig({
      title: "Deactivate Account",
      text: "Are you sure you want to deactivate your account? Active orders will be cancelled and your gigs will be hidden.",
      confirmAction: handleDeactivateAccount,
    });
    setShowModal(true);
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
      setShowModal(false);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      localStorage.removeItem("userDetails");
      localStorage.removeItem("authToken");
      navigate("/");
    } catch (error) {
      console.error("Error deactivating account:", error);
      setMessage({
        type: "error",
        text: "Failed to deactivate account. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Called when ClientProfileHeader saves a location via its own modal
  const handleProfileHeaderLocationSaved = (locationData) => {
    setAddressForm({
      address: locationData.address || "",
      city: locationData.city || "",
      state: locationData.state || "",
      country: locationData.country || "",
      postalCode: locationData.postalCode || ""
    });
    setAddressValidation(null);
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
        <ClientProfileHeader
          refreshTrigger={profileHeaderRefresh}
          onLocationSaved={handleProfileHeaderLocationSaved}
        />
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
                disabled
                className="disabled-input"
                title="First name cannot be changed"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={accountForm.lastName}
                disabled
                className="disabled-input"
                title="Last name cannot be changed"
              />
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
          
          {authProvider === 'Google' ? (
            <div style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '1px solid #90caf9',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <i className="fab fa-google" style={{ fontSize: '24px', color: '#4285f4' }}></i>
                <div>
                  <p style={{ 
                    margin: 0, 
                    fontWeight: 600, 
                    color: '#1565c0',
                    fontSize: '14px'
                  }}>
                    You signed in with Google
                  </p>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    color: '#1976d2',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    Your password is managed by Google. To change it, visit your{' '}
                    <a 
                      href="https://myaccount.google.com/security" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1565c0', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Google Account Security settings
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
          )}
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
            onClick={() => navigate('/app/client/care-needs?returnTo=/app/client/settings')}
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

        {/* Delete Account (Danger Zone) Card */}
        <div className="settings-card" style={{ borderColor: '#ef4444' }}>
          {pendingDeletionDate ? (
            <>
              <h3 style={{ color: '#ef4444' }}>Account Deletion Scheduled</h3>
              <p style={{ marginBottom: '0.5rem' }}>
                Your account is scheduled for permanent deletion on{' '}
                <strong>
                  {pendingDeletionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
                . You can cancel this request before that date to fully restore your account.
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                If your session has expired, use the "Cancel my deletion request" link in your
                scheduled-deletion email.
              </p>
              <button
                type="button"
                className="save-changes-btn"
                onClick={() => setShowCancelDeletionModal(true)}
              >
                Cancel Deletion Request
              </button>
            </>
          ) : (
            <>
              <h3 style={{ color: '#ef4444' }}>Delete Account</h3>
              <p className="deactivation-warning">Requesting deletion will:</p>
              <ul className="deactivation-list">
                <li>Immediately prevent you from logging in.</li>
                <li>Permanently and irreversibly erase all your data after 30 days.</li>
                <li>You cannot delete if you have active orders in progress.</li>
                <li>You have 30 days to cancel — after that the deletion cannot be undone.</li>
              </ul>
              <button
                type="button"
                className="deactivate-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="client-location-modal-overlay" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); setDeleteBlockers([]); }}>
          <div className="client-location-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444' }}>Delete Your Account?</h3>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure? Your account will be <strong>permanently and irreversibly deleted</strong> after
              a 30-day grace period. During that window you can cancel via Settings or the link in your
              scheduled-deletion email.
            </p>
            {deleteBlockers.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#b91c1c' }}>
                  You cannot delete your account right now. Please resolve the following:
                </p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {deleteBlockers.map((b, i) => <li key={i} style={{ color: '#b91c1c' }}>{b}</li>)}
                </ul>
              </div>
            )}
            <div className="form-group">
              <label>Reason for leaving (optional)</label>
              <textarea
                rows={3}
                placeholder="Tell us why you're leaving..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                style={{ width: '100%', resize: 'vertical', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div className="client-modal-buttons">
              <button
                className="client-modal-btn client-modal-cancel"
                onClick={() => { setShowDeleteModal(false); setDeleteReason(''); setDeleteBlockers([]); }}
              >
                Cancel
              </button>
              <button
                className="client-modal-btn client-modal-save"
                style={{ backgroundColor: '#ef4444' }}
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteBlockers([]);
                  try {
                    await accountDeletionService.requestClientDeletion(deleteReason);
                    toast.success('Your account deletion has been scheduled. You will receive a confirmation email.');
                    setShowDeleteModal(false);
                    setDeleteReason('');
                    handleLogout();
                  } catch (err) {
                    const data = err.response?.data || {};
                    if (data.blockers && data.blockers.length > 0) {
                      setDeleteBlockers(data.blockers);
                    } else {
                      toast.error(data.message || err.message || 'Failed to request account deletion.');
                    }
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? 'Processing...' : 'Confirm Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Deletion Confirmation Modal */}
      {showCancelDeletionModal && (
        <div className="client-location-modal-overlay" onClick={() => setShowCancelDeletionModal(false)}>
          <div className="client-location-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Account Deletion?</h3>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to cancel your deletion request? Your account will be fully restored
              immediately.
            </p>
            <div className="client-modal-buttons">
              <button
                className="client-modal-btn client-modal-cancel"
                onClick={() => setShowCancelDeletionModal(false)}
              >
                No, keep deletion scheduled
              </button>
              <button
                className="client-modal-btn client-modal-save"
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    await accountDeletionService.cancelClientDeletion();
                    toast.success('Your account deletion has been cancelled. Your account is restored.');
                    setShowCancelDeletionModal(false);
                    setPendingDeletionDate(null);
                  } catch (err) {
                    if (err.response?.status === 401) {
                      toast.error(
                        'Your session has expired. To cancel your account deletion, please use the "Cancel my deletion request" link in your scheduled-deletion email. After 30 days the link expires — contact codesquareltd@gmail.com for help.'
                      );
                    } else if (err.response?.status === 400) {
                      toast.error(err.response?.data?.message || 'Your grace period has ended. Account deletion cannot be cancelled.');
                    } else {
                      toast.error(err.message || 'Failed to cancel account deletion.');
                    }
                    setShowCancelDeletionModal(false);
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? 'Processing...' : 'Yes, Cancel Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing generic confirmation modal (deactivation etc.) */}
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
