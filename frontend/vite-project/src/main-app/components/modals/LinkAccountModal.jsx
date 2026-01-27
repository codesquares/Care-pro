import { useState } from "react";
import { toast } from "react-toastify";
import config from "../../config";
import GoogleAuthService from "../../services/googleAuthService";
import "./LinkAccountModal.css";

/**
 * LinkAccountModal - Modal for linking Google account to existing local account
 * Shows when user tries to sign in with Google but email already has a local account
 */
const LinkAccountModal = ({ 
  isOpen, 
  onClose, 
  email, 
  googleToken,
  onLinkSuccess 
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);

    try {
      // First, login with email/password to get access token
      const loginResponse = await fetch(`${config.BASE_URL}/Authentications/UserLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        setError(errorData.message || "Invalid password");
        setLoading(false);
        return;
      }

      const loginData = await loginResponse.json();
      const accessToken = loginData.token;

      // Now link Google account
      const linkResult = await GoogleAuthService.linkGoogleAccount(
        googleToken,
        password,
        accessToken
      );

      if (linkResult.success) {
        toast.success("Google account linked successfully!");
        onLinkSuccess?.(loginData);
        onClose();
      } else {
        setError(linkResult.error || "Failed to link account");
      }
    } catch (err) {
      console.error("Link account error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="link-modal-overlay" onClick={handleClose}>
      <div className="link-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="link-modal-close" onClick={handleClose}>
          &times;
        </button>

        <div className="link-modal-header">
          <div className="link-modal-icon">🔗</div>
          <h2>Link Your Google Account</h2>
        </div>

        <p className="link-modal-description">
          An account already exists with <strong>{email}</strong>.
          Enter your password to link your Google account for faster sign-in.
        </p>

        <form onSubmit={handleSubmit} className="link-modal-form">
          <div className="link-form-group">
            <label htmlFor="link-password">Password</label>
            <input
              id="link-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className="link-error">{error}</p>}

          <div className="link-modal-actions">
            <button
              type="button"
              className="link-btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="link-btn-primary"
              disabled={loading}
            >
              {loading ? "Linking..." : "Link Account"}
            </button>
          </div>
        </form>

        <p className="link-modal-note">
          Don't remember your password?{" "}
          <a href="/forgot-password">Reset it here</a>
        </p>
      </div>
    </div>
  );
};

export default LinkAccountModal;
