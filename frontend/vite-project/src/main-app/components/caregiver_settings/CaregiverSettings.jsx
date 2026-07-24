import { useEffect, useState } from "react";
import "./CaregiverSettings.css";
import { toast } from "react-toastify";
import ProfileHeader from "../../pages/care-giver/care-giver-profile/ProfileHeader";
import config from "../../config";
import caregiverBankAccountService from "../../services/caregiverBankAccountService";
import ProfessionalProfileForms from "./ProfessionalProfileForms";
import accountDeletionService from "../../services/accountDeletionService";
import { useAuth } from "../../context/AuthContext";
import { subscribeForPush, unsubscribeFromPush, getSubscriptionState } from "../../services/pushService";
import CaregiverSettingsService from "../../services/CaregiverSettingsService";

const NIGERIAN_BANKS = [
  'Access Bank', 'Guaranty Trust Bank', 'First Bank of Nigeria',
  'United Bank for Africa', 'Zenith Bank', 'Fidelity Bank',
  'Sterling Bank', 'Stanbic IBTC Bank', 'Union Bank of Nigeria',
  'Wema Bank', 'Ecobank Nigeria', 'Heritage Bank', 'Keystone Bank',
  'Polaris Bank', 'Unity Bank', 'Citibank Nigeria',
  'Standard Chartered Bank', 'Providus Bank', 'Kuda Bank', 'Opay', 'PalmPay',
];

const CaregiverSettings = () => {
  const { handleLogout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelDeletionModal, setShowCancelDeletionModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteBlockers, setDeleteBlockers] = useState([]);

  // Bank account state
  const [bankForm, setBankForm] = useState({
    fullName: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [bankErrors, setBankErrors] = useState({});
  const [bankLoading, setBankLoading] = useState(true);
  const [bankSaving, setBankSaving] = useState(false);
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Push notifications state
  const [pushState, setPushState] = useState({ supported: false, permission: 'default', isSubscribed: false });
  const [pushLoading, setPushLoading] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(
    CaregiverSettingsService.defaultPreferences
  );
  const [notificationPrefLoading, setNotificationPrefLoading] = useState(false);

  const userDetails = JSON.parse(localStorage.getItem("userDetails")) || {};

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = userDetails?.id;

        if (!userId) {
          toast.error("User not found. Please log in again.");
          return;
        }

        const response = await fetch(`${config.BASE_URL}/CareGivers/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        });

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

    const fetchBankAccount = async () => {
      try {
        setBankLoading(true);
        const result = await caregiverBankAccountService.getBankAccount(userDetails.id);
        if (result.success && result.data) {
          setBankForm({
            fullName: result.data.fullName || '',
            bankName: result.data.bankName || '',
            accountNumber: result.data.accountNumber || '',
            accountName: result.data.accountName || '',
          });
          setHasSavedBank(true);
        }
      } catch (err) {
        console.error('Error fetching bank account:', err);
      } finally {
        setBankLoading(false);
      }
    };

    fetchUserData();
    if (userDetails?.id) {
      fetchBankAccount();
    }
  }, []);

  useEffect(() => {
    const loadCaregiverNotificationPreferences = async () => {
      if (!userDetails?.id) return;

      setNotificationPrefLoading(true);
      const result = await CaregiverSettingsService.getNotificationPreferences(userDetails.id);

      if (result.success) {
        setNotificationPreferences(result.data);
      } else if (result.error) {
        toast.error(result.error);
      }

      setNotificationPrefLoading(false);
    };

    loadCaregiverNotificationPreferences();
  }, [userDetails?.id]);

  // Load push subscription state on mount
  useEffect(() => {
    getSubscriptionState().then(setPushState).catch(() => {});
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await Promise.all([subscribeForPush(), new Promise((r) => setTimeout(r, 600))]);
        const updated = await getSubscriptionState();
        setPushState(updated);
        toast.success('Push notifications enabled.');
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const updated = await getSubscriptionState();
        setPushState(updated);
      }
    } catch (err) {
      console.error('[CaregiverSettings] Enable push failed:', err);
      toast.error('Could not enable push notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      await Promise.all([unsubscribeFromPush(), new Promise((r) => setTimeout(r, 600))]);
      const updated = await getSubscriptionState();
      setPushState(updated);
      toast.info('Push notifications turned off.');
    } catch (err) {
      console.error('[CaregiverSettings] Disable push failed:', err);
      toast.error('Could not turn off push notifications.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleResubscribePush = async () => {
    setPushLoading(true);
    try {
      await Promise.all([subscribeForPush(), new Promise((r) => setTimeout(r, 600))]);
      const updated = await getSubscriptionState();
      setPushState(updated);
      toast.success('Push notifications re-enabled.');
    } catch (err) {
      console.error('[CaregiverSettings] Re-subscribe push failed:', err);
      toast.error('Could not re-enable push notifications.');
    } finally {
      setPushLoading(false);
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
      const response = await fetch(`${config.BASE_URL}/CareGivers/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setPasswordMessage(errorData.message || "Failed to update password");
        toast.error(errorData.message || "Failed to update password");
        return;
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

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setBankForm((prev) => ({ ...prev, [name]: value }));
    if (bankErrors[name]) {
      setBankErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateBankForm = () => {
    const errs = {};
    if (!bankForm.fullName.trim()) errs.fullName = 'Full name is required';
    if (!bankForm.bankName) errs.bankName = 'Please select a bank';
    if (!bankForm.accountNumber) {
      errs.accountNumber = 'Account number is required';
    } else if (!/^\d{10,}$/.test(bankForm.accountNumber)) {
      errs.accountNumber = 'Account number must be at least 10 digits';
    }
    if (!bankForm.accountName.trim()) errs.accountName = 'Account name is required';
    setBankErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBankSave = async () => {
    if (!validateBankForm()) return;
    try {
      setBankSaving(true);
      const result = await caregiverBankAccountService.upsertBankAccount(bankForm);
      if (result.success) {
        toast.success('Bank account details saved successfully.');
        setHasSavedBank(true);
        setIsEditingBank(false);
      } else {
        toast.error(result.error || 'Failed to save bank details.');
      }
    } catch (err) {
      console.error('Error saving bank account:', err);
      toast.error('An error occurred while saving bank details.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNotificationSave = async () => {
    if (!userDetails?.id) {
      toast.error("Caregiver ID not found. Please log in again.");
      return;
    }

    setNotificationPrefLoading(true);
    const result = await CaregiverSettingsService.updateNotificationPreferences(
      userDetails.id,
      notificationPreferences
    );

    if (result.success) {
      toast.success("Notification preferences updated successfully.");
    } else {
      toast.error(result.error || "Failed to update notification preferences.");
    }

    setNotificationPrefLoading(false);
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
            <h3>Bank Account Details</h3>
            {bankLoading ? (
              <p>Loading bank details...</p>
            ) : hasSavedBank && !isEditingBank ? (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={bankForm.fullName} readOnly />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={bankForm.bankName} readOnly />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" value={bankForm.accountNumber} readOnly />
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input type="text" value={bankForm.accountName} readOnly />
                </div>
                <button className="save-changes-btn" onClick={() => setIsEditingBank(true)}>
                  Edit Bank Details
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter full name"
                    value={bankForm.fullName}
                    onChange={handleBankInputChange}
                  />
                  {bankErrors.fullName && <p className="status-message" style={{ color: 'red' }}>{bankErrors.fullName}</p>}
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <select
                    name="bankName"
                    className="reason-dropdown"
                    value={bankForm.bankName}
                    onChange={handleBankInputChange}
                  >
                    <option value="">Select Bank</option>
                    {NIGERIAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  {bankErrors.bankName && <p className="status-message" style={{ color: 'red' }}>{bankErrors.bankName}</p>}
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={bankForm.accountNumber}
                    onChange={handleBankInputChange}
                  />
                  {bankErrors.accountNumber && <p className="status-message" style={{ color: 'red' }}>{bankErrors.accountNumber}</p>}
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    placeholder="Enter account name"
                    value={bankForm.accountName}
                    onChange={handleBankInputChange}
                  />
                  {bankErrors.accountName && <p className="status-message" style={{ color: 'red' }}>{bankErrors.accountName}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isEditingBank && (
                    <button
                      className="deactivate-btn"
                      style={{ flex: 1 }}
                      onClick={() => setIsEditingBank(false)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="save-changes-btn"
                    style={{ flex: 1 }}
                    onClick={handleBankSave}
                    disabled={bankSaving}
                  >
                    {bankSaving ? 'Saving...' : 'Save Bank Details'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="settings-card">
            <h3>Complete your Professional Profile</h3>
            <ProfessionalProfileForms />
          </div>

          <div className="settings-card">
            <h3>Notification Preferences</h3>
            <p style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
              Manage which caregiver-related notifications you receive.
            </p>
            <div className="notification-options">
              <div className="notification-item">
                <div className="notification-info">
                  <span className="notification-title">Email Notifications</span>
                  <span className="notification-description">Receive caregiver account updates by email</span>
                </div>
                <button
                  type="button"
                  className={`notification-toggle ${notificationPreferences.emailNotifications ? 'active' : ''}`}
                  onClick={() => handleNotificationToggle('emailNotifications')}
                />
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <span className="notification-title">SMS Notifications (Coming soon)</span>
                  <span className="notification-description">Receive caregiver account updates by text message</span>
                </div>
                <button
                  type="button"
                  disabled
                  title="SMS notifications are not available yet."
                  className={`notification-toggle ${notificationPreferences.smsNotifications ? 'active' : ''}`}
                />
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <span className="notification-title">Marketing Emails</span>
                  <span className="notification-description">Receive occasional tips, platform updates, and promotional offers</span>
                </div>
                <button
                  type="button"
                  className={`notification-toggle ${notificationPreferences.marketingEmails ? 'active' : ''}`}
                  onClick={() => handleNotificationToggle('marketingEmails')}
                />
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <span className="notification-title">New Gig Opportunities</span>
                  <span className="notification-description">Email alerts for newly available gig opportunities</span>
                </div>
                <button
                  type="button"
                  className={`notification-toggle ${notificationPreferences.newGig ? 'active' : ''}`}
                  onClick={() => handleNotificationToggle('newGig')}
                />
              </div>
              <div className="notification-item">
                <div className="notification-info">
                  <span className="notification-title">Care Request Updates</span>
                  <span className="notification-description">Email updates for care-request matches and shortlist/hiring flow</span>
                </div>
                <button
                  type="button"
                  className={`notification-toggle ${notificationPreferences.careRequestUpdates ? 'active' : ''}`}
                  onClick={() => handleNotificationToggle('careRequestUpdates')}
                />
              </div>
            </div>
            <button
              className="save-changes-btn"
              onClick={handleNotificationSave}
              disabled={notificationPrefLoading}
            >
              {notificationPrefLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* ── Push Notifications ──────────────────────────────────────────── */}
          {pushState.supported && (
            <div className="settings-card">
              <h3>Push Notifications</h3>
              <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                Receive alerts for job matches, visit reminders, and wallet updates even when the app is closed.
              </p>
              {pushState.permission === 'denied' ? (
                <p style={{ color: '#ef4444' }}>
                  Notifications are blocked by your browser. Open your browser settings to allow them for this site.
                </p>
              ) : pushState.permission === 'granted' && pushState.isSubscribed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 500 }}>&#10003; Notifications are On</span>
                  <button
                    className="deactivate-btn"
                    onClick={handleDisablePush}
                    disabled={pushLoading}
                  >
                    {pushLoading ? 'Updating...' : 'Turn Off'}
                  </button>
                </div>
              ) : pushState.permission === 'granted' && !pushState.isSubscribed ? (
                <button className="save-changes-btn" onClick={handleResubscribePush} disabled={pushLoading}>
                  {pushLoading ? 'Updating...' : 'Re-enable Notifications'}
                </button>
              ) : (
                <button className="save-changes-btn" onClick={handleEnablePush} disabled={pushLoading}>
                  {pushLoading ? 'Requesting...' : 'Enable Notifications'}
                </button>
              )}
            </div>
          )}

          {/* ── Delete Account (Danger Zone) ───────────────────────────────── */}
          <div className="settings-card" style={{ borderColor: '#ef4444' }}>
            {userData?.accountDeletionRequestedAt ? (
              <>
                <h3 style={{ color: '#ef4444' }}>Account Deletion Scheduled</h3>
                <p style={{ marginBottom: '0.5rem' }}>
                  Your account is scheduled for permanent deletion on{' '}
                  <strong>
                    {new Date(
                      new Date(userData.accountDeletionRequestedAt).getTime() +
                        30 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                  . Until then, your profile and gigs are hidden.
                </p>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  You can cancel this request before that date to fully restore your account and gigs.
                  If your session has expired, use the "Cancel my deletion request" link in your
                  scheduled-deletion email.
                </p>
                <button
                  className="save-changes-btn"
                  onClick={() => setShowCancelDeletionModal(true)}
                >
                  Cancel Deletion Request
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: '#ef4444' }}>Delete Account</h3>
                <p className="deactivation-warning">
                  Requesting deletion will:
                </p>
                <ul className="deactivation-list">
                  <li>Immediately hide your profile and all active gigs.</li>
                  <li>Permanently and irreversibly erase all your data after 30 days.</li>
                  <li>You cannot delete if you have active orders, a pending withdrawal, or an outstanding wallet balance.</li>
                  <li>You have 30 days to cancel — after that the deletion cannot be undone.</li>
                </ul>
                <button
                  className="deactivate-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ─────────────────────────────── */}
      {showDeleteModal && (
        <div className="client-location-modal-overlay" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); setDeleteBlockers([]); }}>
          <div className="client-location-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ef4444' }}>Delete Your Account?</h3>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure? Your account will be <strong>permanently and irreversibly deleted</strong> after
              a 30-day grace period. During that time you can cancel via Settings or the link in your
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
                    const result = await accountDeletionService.requestCaregiverDeletion(deleteReason);
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

      {/* ── Cancel Deletion Confirmation Modal ────────────────────────────── */}
      {showCancelDeletionModal && (
        <div className="client-location-modal-overlay" onClick={() => setShowCancelDeletionModal(false)}>
          <div className="client-location-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Account Deletion?</h3>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to cancel your deletion request? Your account and all your gigs will be
              fully restored immediately.
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
                    await accountDeletionService.cancelCaregiverDeletion();
                    toast.success('Your account deletion has been cancelled. Your account and gigs are restored.');
                    setShowCancelDeletionModal(false);
                    // Refresh userData so the UI reflects the restored state
                    setUserData((prev) => prev ? { ...prev, accountDeletionRequestedAt: null } : prev);
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
    </>
  );
};

export default CaregiverSettings;