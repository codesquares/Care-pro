import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import GigService from "../../../services/gigService";

import Toast from "../../../components/toast/Toast";
import useToast from "../../../hooks/useToast";
import { useGigEdit } from "../../../contexts/GigEditContext";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import Modal from "../../../components/modal/Modal";
import "../../../pages/client/client-dashboard/marketplaceHero.css";
import "./gigs-section.css";

const GigsSection = () => {
  const [gigs, setGigs] = useState([]);
  const [deletedGigs, setDeletedGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishingGigs, setPublishingGigs] = useState(new Set());
  const [pausingGigs, setPausingGigs] = useState(new Set());
  const [deletingGigs, setDeletingGigs] = useState(new Set());
  const [restoringGigs, setRestoringGigs] = useState(new Set());
  const [activeTab, setActiveTab] = useState("active");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gigToDelete, setGigToDelete] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = "/app/caregiver";
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { populateFromGig, resetForm } = useGigEdit();
  const { canPublishGigs, isVerified, isQualified, hasCertificates, isLoading: statusLoading, eligibilityChecked, hasErrors: statusHasErrors, refreshStatusData } = useCaregiverStatus();

  const handleNavigateToCreateGig = () => {
    // Reset form when creating new gig
    resetForm();
    navigate(`${basePath}/create-gigs`);
  };

  const handleEditGig = async (gig) => {
    // Populate the context with all gig data for editing
    populateFromGig(gig);
    
    // Add a small delay to allow the reducer to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    navigate(`${basePath}/create-gigs`);
  };

  const handlePublishGig = async (gig) => {
    // If status is still loading, refresh and wait before checking
    if (statusLoading) {
      showError('Checking your eligibility, please try again in a moment.');
      return;
    }

    // Check if we can publish (less than 2 active gigs AND caregiver eligibility)
    if (activeGigs.length >= 2) {
      showError('You can only have 2 active gigs at a time. Please pause one of your active gigs first to publish this one.');
      return;
    }
    if (!canPublishGigs) {
      // Build specific eligibility error message
      const missingRequirements = [];
      if (!isVerified) missingRequirements.push('Complete identity verification');
      if (!isQualified) missingRequirements.push('Pass qualification assessment');
      if (!hasCertificates) missingRequirements.push('Upload at least one certificate');
      
      showError(`To publish gigs, you need to: ${missingRequirements.join(', ')}`);
      return;
    }

    try {
      // Add gig to publishing set to show loading state
      setPublishingGigs(prev => new Set(prev).add(gig.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      await api.put(`/Gigs/UpdateGigStatusToPause/${gig.id}`, {
        status: 'published',
        caregiverId: userDetails.id
      });

      // Update the gig status in local state
      setGigs(prevGigs => 
        prevGigs.map(g => 
          g.id === gig.id 
            ? { ...g, status: 'published' }
            : g
        )
      );

      // Show success message (you can replace this with a toast notification)
      showSuccess('Gig published successfully!');
      
    } catch (err) {
      console.error('Error publishing gig:', err);
      showError('Failed to publish gig. Please try again.');
    } finally {
      // Remove gig from publishing set
      setPublishingGigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(gig.id);
        return newSet;
      });
    }
  };

  const handlePauseGig = async (gig) => {
    try {
      // Add gig to pausing set to show loading state
      setPausingGigs(prev => new Set(prev).add(gig.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      await api.put(`/Gigs/UpdateGigStatusToPause/${gig.id}`, {
        status: 'paused',
        caregiverId: userDetails.id
      });

      // Update the gig status in local state
      setGigs(prevGigs => 
        prevGigs.map(g => 
          g.id === gig.id 
            ? { ...g, status: 'paused' }
            : g
        )
      );

      showSuccess('Gig paused successfully!');
      
    } catch (err) {
      console.error('Error pausing gig:', err);
      showError('Failed to pause gig. Please try again.');
    } finally {
      // Remove gig from pausing set
      setPausingGigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(gig.id);
        return newSet;
      });
    }
  };

  const handleDeleteGig = (gig) => {
    setGigToDelete(gig);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteGig = async () => {
    if (!gigToDelete) return;

    try {
      setIsDeleteModalOpen(false);
      setDeletingGigs(prev => new Set(prev).add(gigToDelete.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const result = await GigService.softDeleteGig(gigToDelete.id, userDetails.id);

      if (!result.success) {
        // Backend returns user-friendly obligation error messages — show directly
        showError(result.message);
        return;
      }

      // Remove the gig from active list
      setGigs(prevGigs => prevGigs.filter(g => g.id !== gigToDelete.id));
      showSuccess('Gig deleted. You can restore it within 30 days.');

      // Refresh deleted gigs list if on that tab
      if (activeTab === 'deleted') {
        fetchDeletedGigs();
      }
    } catch (err) {
      console.error('Error deleting gig:', err);
      showError(err.message || 'Failed to delete gig. Please try again.');
    } finally {
      if (gigToDelete) {
        setDeletingGigs(prev => {
          const newSet = new Set(prev);
          newSet.delete(gigToDelete.id);
          return newSet;
        });
      }
      setGigToDelete(null);
    }
  };

  const handleRestoreGig = async (gig) => {
    try {
      console.log('Restore gig — id:', gig.id, 'length:', gig.id?.length, 'canRestore:', gig.canRestore);
      setRestoringGigs(prev => new Set(prev).add(gig.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const result = await GigService.restoreGig(gig.id, userDetails.id);

      if (!result.success) {
        showError(result.message);
        return;
      }

      // Remove from deleted list
      setDeletedGigs(prev => prev.filter(g => g.id !== gig.id));
      showSuccess('Your gig has been restored as a Draft. Please review your details and republish when ready.');

      // Refresh the main gigs list to show the restored draft
      fetchGigs();
    } catch (err) {
      console.error('Error restoring gig:', err);
      showError(err.message || 'Failed to restore gig. Please try again.');
    } finally {
      setRestoringGigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(gig.id);
        return newSet;
      });
    }
  };

  // Filter gigs based on status
  const activeGigs = useMemo(() => {
    const status = (gig) => gig.status?.toLowerCase();
    return gigs.filter(gig => status(gig) === 'published' || status(gig) === 'active');
  }, [gigs]);

  const pausedGigs = useMemo(() => {
    return gigs.filter(gig => gig.status?.toLowerCase() === 'paused');
  }, [gigs]);

  const draftGigs = useMemo(() => {
    return gigs.filter(gig => gig.status?.toLowerCase() === 'draft');
  }, [gigs]);

  // Check if user can publish new gigs (max 2 active gigs allowed)
  // While status is still loading, allow publish attempts (the handler will re-check)
  const canPublishNewGig = useMemo(() => 
    activeGigs.length < 2 && (statusLoading || canPublishGigs), 
    [activeGigs, canPublishGigs, statusLoading]
  );

  const handleShareGig = async (gig) => {
    const url = `${window.location.origin}/service/${gig.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: gig.title, url });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          showSuccess('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      showSuccess('Link copied to clipboard!');
    }
  };

  // Extract fetchGigs as a reusable function
  const fetchGigs = async () => {
    try {
      setIsLoading(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const response = await api.get(`/Gigs/caregiver/${userDetails.id}`);
      // Normalize PascalCase fields from backend
      const normalized = (response.data || []).map(g => ({
        ...g,
        isSpecialGig: g.isSpecialGig || g.IsSpecialGig || false,
        careRequestId: g.careRequestId || g.CareRequestId || null,
        scopedClientId: g.scopedClientId || g.ScopedClientId || null,
      }));
      setGigs(normalized);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Fetch deleted gigs for the "Deleted Gigs" tab
  const fetchDeletedGigs = useCallback(async () => {
    try {
      setDeletedLoading(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) return;

      const result = await GigService.getDeletedGigs(userDetails.id);
      if (result.success) {
        setDeletedGigs(result.data);
      }
    } catch (err) {
      console.error('Error fetching deleted gigs:', err);
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  // Support deep-link via ?tab=deleted (e.g., from deletion reminder notifications)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'deleted') {
      setActiveTab('deleted');
      // Clean up the query param so it doesn't persist on refresh
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Fetch deleted gigs when the tab is selected
  useEffect(() => {
    if (activeTab === 'deleted') {
      fetchDeletedGigs();
    }
  }, [activeTab, fetchDeletedGigs]);

  // Fetch gigs on mount and when returning from edit page
  useEffect(() => {
    fetchGigs();
    // Refresh caregiver eligibility status to ensure fresh data
    refreshStatusData();
    
    // Clear the navigation state after using it
    if (location.state?.refreshGigs) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.refreshGigs]);

  // Retry loading caregiver status if it failed (e.g., due to transient auth issues)
  useEffect(() => {
    if (eligibilityChecked && statusHasErrors && refreshStatusData) {
      refreshStatusData();
    }
  }, [eligibilityChecked, statusHasErrors]);

  if (isLoading) {
    return (
      <div className="gigs-page">
        <div className="gigs-spinner-container">
          <div className="gigs-spinner" />
          <p>Loading gigs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gigs-page">
        <p>Error: {error}</p>
      </div>
    );
  }

  const currentGigs = activeTab === 'active' ? activeGigs
    : activeTab === 'paused' ? pausedGigs
    : activeTab === 'draft' ? draftGigs
    : [];

  const hasAnyGigs = activeGigs.length > 0 || pausedGigs.length > 0 || draftGigs.length > 0;

  return (
    <div className="gigs-page">
      {/* ── Banner ── */}
      <div className="marketplace-banner gigs-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">Manage your Gig</h1>
          <p className="marketplace-banner-subtitle">Offer your services to clients all over the world.</p>
        </div>
        <div className="gigs-banner-right">
          <button className="gigs-create-btn" onClick={handleNavigateToCreateGig}>
            ✏️ Create gig
          </button>
        </div>
      </div>

      <div className="gigs-content">
        {/* ── Tabs ── */}
        <div className="gigs-tabs">
          <button className={`gigs-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active</button>
          <button className={`gigs-tab ${activeTab === 'paused' ? 'active' : ''}`} onClick={() => setActiveTab('paused')}>Paused</button>
          <button className={`gigs-tab ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>Draft</button>
          <button className={`gigs-tab ${activeTab === 'deleted' ? 'active' : ''}`} onClick={() => setActiveTab('deleted')}>Deleted</button>
        </div>

        {/* ── Eligibility notice ── */}
        {(activeTab === "paused" || activeTab === "draft") && !canPublishNewGig && eligibilityChecked && !statusLoading && !statusHasErrors && (
          <div className="gigs-eligibility-notice">
            {activeGigs.length >= 2 ? (
              <p>⚠️ You have reached the maximum of 2 active gigs. Pause an active gig to publish more.</p>
            ) : (
              <div>
                <p>⚠️ To publish gigs, you need to complete the following requirements:</p>
                <ul className="gigs-eligibility-list">
                  <li className={isVerified ? 'completed' : 'pending'}>{isVerified ? '✅' : '❌'} Complete identity verification</li>
                  <li className={isQualified ? 'completed' : 'pending'}>{isQualified ? '✅' : '❌'} Pass qualification assessment</li>
                  <li className={hasCertificates ? 'completed' : 'pending'}>{hasCertificates ? '✅' : '❌'} Upload at least one certificate</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Table header ── */}
        <div className="gigs-table-header">
          <span className="gigs-th gigs-th--gig">Gig</span>
          <span className="gigs-th gigs-th--orders">Orders</span>
          <span className="gigs-th gigs-th--action">Action</span>
        </div>

        {/* ── Deleted tab ── */}
        {activeTab === 'deleted' ? (
          deletedLoading ? (
            <div className="gigs-spinner-container">
              <div className="gigs-spinner" />
              <p>Loading deleted gigs...</p>
            </div>
          ) : deletedGigs.length === 0 ? (
            <div className="gigs-empty">
              <h4>No Deleted Gigs</h4>
              <p>You don't have any recently deleted gigs.</p>
            </div>
          ) : (
            <div className="gigs-table-body">
              {deletedGigs.map((gig) => {
                const daysLeft = gig.daysRemaining ?? 0;
                const isExpired = !gig.canRestore;
                return (
                  <div key={gig.id} className={`gigs-row ${isExpired ? 'gigs-row--expired' : ''}`}>
                    <div className="gigs-cell gigs-cell--gig">
                      {gig.image1 ? (
                        <img src={gig.image1} alt={gig.title} className="gigs-thumb" />
                      ) : (
                        <div className="gigs-thumb gigs-thumb--placeholder">🩺</div>
                      )}
                      <div className="gigs-cell-info">
                        <span className="gigs-cell-title">{gig.title}</span>
                        <span className="gigs-cell-meta">
                          {isExpired ? 'Permanently deleted' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} to restore`}
                        </span>
                      </div>
                    </div>
                    <div className="gigs-cell gigs-cell--orders">
                      <span className="gigs-order-count">{gig.orderCount ?? 0}</span>
                    </div>
                    <div className="gigs-cell gigs-cell--action">
                      {!isExpired && (
                        <button className="gigs-link" onClick={() => handleRestoreGig(gig)} disabled={restoringGigs.has(gig.id)}>
                          {restoringGigs.has(gig.id) ? 'Restoring...' : 'Restore'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : !hasAnyGigs ? (
          /* ── No gigs at all ── */
          <div className="gigs-empty">
            <h4>Create and publish your first Gig</h4>
            <button className="gigs-empty-btn" onClick={handleNavigateToCreateGig}>Create Gig</button>
          </div>
        ) : currentGigs.length === 0 ? (
          <div className="gigs-empty">
            <h4>No {activeTab} gigs</h4>
            <p>You don't have any {activeTab} gigs right now.</p>
          </div>
        ) : (
          /* ── Gig rows ── */
          <div className="gigs-table-body">
            {currentGigs.map((gig) => (
              <div key={gig.id} className="gigs-row">
                <div className="gigs-cell gigs-cell--gig">
                  {gig.image1 ? (
                    <img src={gig.image1} alt={gig.title} className="gigs-thumb" />
                  ) : (
                    <div className="gigs-thumb gigs-thumb--placeholder">🩺</div>
                  )}
                  <div className="gigs-cell-info">
                    <span className="gigs-cell-title">{gig.title}</span>
                    {gig.isSpecialGig && <span className="gigs-badge gigs-badge--care-request">Care Request</span>}
                  </div>
                </div>
                <div className="gigs-cell gigs-cell--orders">
                  <span className="gigs-order-count">{gig.orderCount ?? 0}</span>
                </div>
                <div className="gigs-cell gigs-cell--action">
                  {gig.isSpecialGig ? (
                    <button className="gigs-link" onClick={() => navigate(`/service/${gig.id}`)}>Preview</button>
                  ) : (
                    <>
                      {activeTab === 'active' && (
                        <>
                          <button className="gigs-link" onClick={() => navigate(`/service/${gig.id}`)}>Preview</button>
                          <button className="gigs-link" onClick={() => handleShareGig(gig)}>Share</button>
                          <button className="gigs-link" onClick={() => handlePauseGig(gig)} disabled={pausingGigs.has(gig.id)}>
                            {pausingGigs.has(gig.id) ? 'Pausing...' : 'Pause'}
                          </button>
                        </>
                      )}
                      {activeTab === 'paused' && (
                    <>
                      <button className="gigs-link" onClick={() => handleEditGig(gig)}>Edit</button>
                      <button
                        className="gigs-link"
                        onClick={() => handlePublishGig(gig)}
                        disabled={publishingGigs.has(gig.id) || !canPublishNewGig}
                        title={!canPublishNewGig ? (activeGigs.length >= 2 ? 'Max 2 active gigs. Pause one first.' : 'Complete verification to publish.') : ''}
                      >
                        {publishingGigs.has(gig.id) ? 'Publishing...' : 'Publish'}
                      </button>
                      <button className="gigs-link gigs-link--danger" onClick={() => handleDeleteGig(gig)} disabled={deletingGigs.has(gig.id)}>
                        {deletingGigs.has(gig.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                  {activeTab === 'draft' && (
                    <>
                      <button className="gigs-link" onClick={() => handleEditGig(gig)}>Edit</button>
                      <button
                        className="gigs-link"
                        onClick={() => handlePublishGig(gig)}
                        disabled={publishingGigs.has(gig.id) || !canPublishNewGig}
                        title={!canPublishNewGig ? (activeGigs.length >= 2 ? 'Max 2 active gigs. Pause one first.' : 'Complete verification to publish.') : ''}
                      >
                        {publishingGigs.has(gig.id) ? 'Publishing...' : 'Publish'}
                      </button>
                      <button className="gigs-link gigs-link--danger" onClick={() => handleDeleteGig(gig)} disabled={deletingGigs.has(gig.id)}>
                        {deletingGigs.has(gig.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Container */}
      <div className="gigs-toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            show={toast.show}
            onClose={() => removeToast(toast.id)}
            type={toast.type}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGigToDelete(null);
        }}
        onProceed={confirmDeleteGig}
        title="Delete Gig?"
        description={`Are you sure you want to delete "${gigToDelete?.title}"? It will be hidden immediately. You have **30 days** to restore it before it is permanently deleted.`}
        buttonText="Delete"
        buttonBgColor="#dc2626"
        secondaryButtonText="Cancel"
        onSecondaryAction={() => {
          setIsDeleteModalOpen(false);
          setGigToDelete(null);
        }}
        isError={true}
      />
    </div>
  );
};

export default GigsSection;
