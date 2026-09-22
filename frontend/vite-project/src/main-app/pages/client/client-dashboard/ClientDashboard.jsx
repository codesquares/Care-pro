
import { useState, useEffect } from "react";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import ClientDashboardHero from "./ClientDashboardHero";
import ClientProfileService from "../../../services/clientProfileService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";
import accountDeletionService from "../../../services/accountDeletionService";

const ClientDashboard = () => {
  const [careNeedsSet, setCareNeedsSet] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(10);
  const [pendingDeletionDate, setPendingDeletionDate] = useState(null);
  const [showDeletionBanner, setShowDeletionBanner] = useState(true);
  const [cancelDeletionLoading, setCancelDeletionLoading] = useState(false);
  const [showCancelDeletionConfirm, setShowCancelDeletionConfirm] = useState(false);
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

  // Calculate profile completion percentage from real data
  const calculateProfileCompletion = (profile, hasCareNeeds) => {
    const fields = [
      { check: () => !!profile?.firstName, weight: 10 },
      { check: () => !!profile?.lastName, weight: 10 },
      { check: () => !!profile?.email, weight: 10 },
      { check: () => !!profile?.phoneNumber, weight: 15 },
      { check: () => !!profile?.location, weight: 15 },
      { check: () => !!profile?.bio, weight: 10 },
      { check: () => !!profile?.profilePicture && profile.profilePicture !== '', weight: 15 },
      { check: () => !!profile?.isVerified, weight: 5 },
      { check: () => hasCareNeeds, weight: 10 },
    ];
    return fields.reduce((sum, f) => sum + (f.check() ? f.weight : 0), 0);
  };

  // Fetch profile and care needs to compute completion
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const clientId = user?.id;
        if (!clientId) return;

        const [profile, careNeeds] = await Promise.all([
          ClientProfileService.getProfile(clientId).catch(() => null),
          ClientCareNeedsService.getCareNeeds().catch(() => null),
        ]);

        const hasCareNeeds = !!(careNeeds?.serviceCategories && careNeeds.serviceCategories.length > 0);
        setCareNeedsSet(hasCareNeeds);
        setProfileCompletion(calculateProfileCompletion(profile, hasCareNeeds));

        // Check for pending account deletion
        if (profile?.accountDeletionRequestedAt) {
          const deletionDate = new Date(
            new Date(profile.accountDeletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
          );
          setPendingDeletionDate(deletionDate);
        }
      } catch (err) {
        console.warn('Could not fetch profile completion data:', err);
      }
    };
    fetchProfileData();
  }, [user?.id]);

  return (
    <div className="dashboard client-dashboard-flex">
      {/* Pending deletion banner */}
      {pendingDeletionDate && showDeletionBanner && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
          padding: '0.875rem 1rem', margin: '0 0 0.75rem', display: 'flex',
          alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🗑️</span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#9a3412' }}>
              Your account is scheduled for permanent deletion on{' '}
              {pendingDeletionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#c2410c' }}>
              Cancel this request before that date to restore your account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowCancelDeletionConfirm(true)}
              style={{
                background: '#ea580c', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '0.4rem 0.9rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              Cancel Deletion
            </button>
            <button
              onClick={() => setShowDeletionBanner(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#9a3412', fontSize: '1.1rem', lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Cancel deletion confirm overlay */}
      {showCancelDeletionConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={() => setShowCancelDeletionConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '10px', padding: '1.5rem',
              maxWidth: '420px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Cancel Account Deletion?</h3>
            <p>Are you sure you want to cancel your deletion request? Your account will be fully restored immediately.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowCancelDeletionConfirm(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
                }}
              >
                No, keep scheduled
              </button>
              <button
                disabled={cancelDeletionLoading}
                onClick={async () => {
                  setCancelDeletionLoading(true);
                  try {
                    await accountDeletionService.cancelClientDeletion();
                    setPendingDeletionDate(null);
                    setShowDeletionBanner(false);
                    setShowCancelDeletionConfirm(false);
                  } catch (err) {
                    setShowCancelDeletionConfirm(false);
                    if (err.response?.status === 401) {
                      alert('Your session has expired. Use the "Cancel my deletion request" link in your scheduled-deletion email. After 30 days contact codesquareltd@gmail.com.');
                    } else if (err.response?.status === 400) {
                      alert(err.response?.data?.message || 'Your grace period has ended. Account deletion cannot be cancelled.');
                    } else {
                      alert('Failed to cancel account deletion. Please try again.');
                    }
                  } finally {
                    setCancelDeletionLoading(false);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {cancelDeletionLoading ? 'Processing...' : 'Yes, Cancel Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rightbar">
        <ClientDashboardHero
          userName={user.firstName || 'User'}
          profileCompletion={profileCompletion}
          remindersCount={3}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;


