import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ClientSettings.css";
import defaultAvatar from "../../../../assets/profilecard1.png";
import ClientSettingsService from "../../../services/ClientSettingsService";

const deactivationReasons = [
  "I'm no longer hiring caregivers",
  "I found another platform",
  "I'm concerned about my privacy",
  "I'm getting too many notifications",
  "Other",
];

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const ClientSettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userDetails, setUserDetails] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Very Weak",
    color: "#f85c70",
  });

  const [, setValidationStates] = useState({
    firstName: { isValid: true, message: "" },
    lastName: { isValid: true, message: "" },
    email: { isValid: true, message: "" },
    currentPassword: { isValid: true, message: "" },
    newPassword: { isValid: true, message: "" },
    confirmPassword: { isValid: true, message: "" },
  });

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    text: "",
    confirmAction: () => {},
  });

  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        setIsLoading(true);
        const stored = JSON.parse(localStorage.getItem("userDetails") || "{}");

        setUserDetails(stored);
        setPreviewUrl(stored.profilePicture || null);
        setAccountForm({
          firstName: stored.firstName || "",
          lastName: stored.lastName || "",
          email: stored.email || "",
        });
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

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
      case "email":
        isValid = validateEmail(value);
        validationMessage = isValid ? "" : "Please enter a valid email address";
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

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    const [firstName, ...rest] = value.split(" ");
    const lastName = rest.join(" ");
    setAccountForm((prev) => ({ ...prev, firstName: firstName || "", lastName }));
    validateField("firstName", firstName || "");
    validateField("lastName", lastName);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);

    if (name === "newPassword" && passwordForm.confirmPassword) {
      validateField("confirmPassword", passwordForm.confirmPassword);
    }
  };

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
      const stored = JSON.parse(localStorage.getItem("userDetails") || "{}");
      const updatedDetails = {
        ...stored,
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
      };
      localStorage.setItem("userDetails", JSON.stringify(updatedDetails));
      setUserDetails(updatedDetails);

      await new Promise((resolve) => setTimeout(resolve, 800));
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

    const currentPasswordValid = validateField(
      "currentPassword",
      passwordForm.currentPassword
    );
    const newPasswordValid = validateField("newPassword", passwordForm.newPassword);
    const confirmPasswordValid = validateField(
      "confirmPassword",
      passwordForm.confirmPassword
    );

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
        text:
          error?.response?.data?.message ||
          error.message ||
          "Failed to change password. Please try again later.",
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

  const fullName = `${accountForm.firstName} ${accountForm.lastName}`.trim() || "Your name";
  const username =
    userDetails.username ||
    userDetails.handle ||
    (accountForm.email ? accountForm.email.split("@")[0] : "your-handle");
  const locationDisplay =
    userDetails.location ||
    [userDetails.city, userDetails.state, userDetails.country].filter(Boolean).join(", ");
  const memberSinceDisplay = formatDate(userDetails.createdAt);

  const isAccountDirty =
    accountForm.firstName !== (userDetails.firstName || "") ||
    accountForm.lastName !== (userDetails.lastName || "");
  const isPasswordReady =
    passwordForm.currentPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword;

  return (
    <div className="client-settings-page">
      <h1 className="client-settings-page__title">My Settings</h1>

      <div className="client-settings-page__grid">
        <aside className="profile-card">
          <img
            src={previewUrl || defaultAvatar}
            alt="Profile"
            className="profile-card__avatar"
          />
          <h3 className="profile-card__name">{fullName || "Your Name"}</h3>
          <p className="profile-card__handle">@{username}</p>

          <div className="profile-card__rating">
            <span className="stars">★★★★★</span>
            <span className="score">4.7</span>
            <span>(200 Reviews)</span>
          </div>

          <div className="profile-card__divider" />

          <div className="profile-card__meta">
            <div className="profile-card__meta-row location">
              <span className="label">Location:</span>
              <span className="value">{locationDisplay || "Lagos, Nigeria"}</span>
            </div>
            <div className="profile-card__meta-row member">
              <span className="label">Member since:</span>
              <span className="value">{memberSinceDisplay || "20th June, 2024"}</span>
            </div>
          </div>
        </aside>

        <div className="settings-panel">
          {message.text && (
            <div className={`settings-alert ${message.type}`}>{message.text}</div>
          )}

          <section className="panel-section">
            <div className="panel-section__header">
              <h2>Account Details</h2>
            </div>
            <form className="panel-form" onSubmit={handleAccountSave}>
              <div>
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={handleFullNameChange}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={accountForm.email}
                  readOnly
                  disabled
                />
                <p className="helper-text">Email updates require contacting support.</p>
              </div>

              <div className="panel-actions">
                <button type="submit" disabled={isLoading || !isAccountDirty}>
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="panel-section">
            <div className="panel-section__header">
              <h2>Update Password</h2>
            </div>
            <form className="panel-form" onSubmit={handlePasswordSave}>
              <div>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                <div className="password-strength">
                  <div className="password-strength__bar">
                    <span
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        background: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span>{passwordStrength.label}</span>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="panel-actions">
                <button type="submit" disabled={isLoading || !isPasswordReady}>
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="panel-section">
            <div className="panel-section__header">
              <h2>Account Deactivation</h2>
            </div>
            <div className="deactivate-card">
              <p>What happens when you deactivate your account?</p>
              <ul>
                <li>Your profile and gigs won't be shown anymore.</li>
                <li>Active orders will be cancelled.</li>
                <li>You won't be able to re-activate your gigs.</li>
              </ul>

              <div className="panel-form">
                <div>
                  <label htmlFor="deactivationReason">I'm leaving because...</label>
                  <select
                    id="deactivationReason"
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                  >
                    <option value="">Choose a reason</option>
                    {deactivationReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="deactivate-actions">
                <button
                  type="button"
                  onClick={showDeactivateConfirmation}
                  disabled={isLoading || !deactivationReason}
                >
                  Deactivate account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showModal && (
        <div className="settings-modal">
          <div className="settings-modal__content">
            <h3>{modalConfig.title}</h3>
            <p>{modalConfig.text}</p>
            <div className="settings-modal__actions">
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={modalConfig.confirmAction}
                disabled={isLoading}
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
