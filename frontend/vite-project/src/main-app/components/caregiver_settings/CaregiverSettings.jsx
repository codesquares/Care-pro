import { useEffect, useState } from "react";
import "./CaregiverSettings.css";
import { toast } from "react-toastify";
import ProfileHeader from "../../pages/care-giver/care-giver-profile/ProfileHeader";
import config from "../../config";
import caregiverBankAccountService from "../../services/caregiverBankAccountService";

const NIGERIAN_BANKS = [
  'Access Bank', 'Guaranty Trust Bank', 'First Bank of Nigeria',
  'United Bank for Africa', 'Zenith Bank', 'Fidelity Bank',
  'Sterling Bank', 'Stanbic IBTC Bank', 'Union Bank of Nigeria',
  'Wema Bank', 'Ecobank Nigeria', 'Heritage Bank', 'Keystone Bank',
  'Polaris Bank', 'Unity Bank', 'Citibank Nigeria',
  'Standard Chartered Bank', 'Providus Bank', 'Kuda Bank', 'Opay', 'PalmPay',
];

const CaregiverSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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