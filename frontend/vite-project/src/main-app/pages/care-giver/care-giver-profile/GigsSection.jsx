import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import GigService from "../../../services/gigService";

import clock from "../../../../assets/main-app/clock.png";
import Toast from "../../../components/toast/Toast";
import useToast from "../../../hooks/useToast";
import { useGigEdit } from "../../../contexts/GigEditContext";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import Modal from "../../../components/modal/Modal";
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
    // Check if we can publish (less than 2 active gigs AND caregiver eligibility)
    if (!canPublishNewGig) {
      if (activeGigs.length >= 2) {
        showError('You can only have 2 active gigs at a time. Please pause one of your active gigs first to publish this one.');
      } else if (!canPublishGigs) {
        // Build specific eligibility error message
        const missingRequirements = [];
        if (!isVerified) missingRequirements.push('Complete identity verification');
        if (!isQualified) missingRequirements.push('Pass qualification assessment');
        if (!hasCertificates) missingRequirements.push('Upload at least one certificate');
        
        showError(`To publish gigs, you need to: ${missingRequirements.join(', ')}`);
      }
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
  const canPublishNewGig = useMemo(() => 
    activeGigs.length < 2 && canPublishGigs, 
    [activeGigs, canPublishGigs]
  );

  // Extract fetchGigs as a reusable function
  const fetchGigs = async () => {
    try {
      setIsLoading(true);
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const response = await api.get(`/Gigs/caregiver/${userDetails.id}`);
      setGigs(response.data);
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
      <div className="caregiver-gigs-section">
        <div className="caregiver-spinner-container">
          <div className="caregiver-spinner" />
          <p>Loading gigs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="caregiver-gigs-section">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="caregiver-gigs-section">
      <h3>Active Gigs</h3>
      
      {/* Tab Navigation */}
      <div className="caregiver-gigs-tabs">
        <button 
          className={`caregiver-gigs-tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Gigs ({activeGigs.length})
        </button>
        <button 
          className={`caregiver-gigs-tab ${activeTab === "paused" ? "active" : ""}`}
          onClick={() => setActiveTab("paused")}
        >
          Paused Gigs ({pausedGigs.length})
        </button>
        <button 
          className={`caregiver-gigs-tab ${activeTab === "draft" ? "active" : ""}`}
          onClick={() => setActiveTab("draft")}
        >
          Draft Gigs ({draftGigs.length})
        </button>
        <button 
          className={`caregiver-gigs-tab ${activeTab === "deleted" ? "active" : ""}`}
          onClick={() => setActiveTab("deleted")}
        >
          Deleted Gigs
        </button>
      </div>

      {/* No Gigs State */}
      {activeGigs.length === 0 && pausedGigs.length === 0 && draftGigs.length === 0 ? (
        <div className="caregiver-empty-state">
          <img src={clock} alt="No Gigs" style={{ width: 80, marginBottom: 16 }} />
          <h4>No Gigs Yet</h4>
          <p>You haven't created any gigs. Get started by creating one.</p>
          <button className="caregiver-create-gig-btn" onClick={handleNavigateToCreateGig}>
            Create Your First Gig
          </button>
        </div>
      ) : (
      <div className="caregiver-gigs-grid">
        {/* Create New Gig Card - Always first */}
        <div className="caregiver-create-new-gig" onClick={handleNavigateToCreateGig}>
          <span className="caregiver-create-icon">+</span>
          <p className="caregiver-create-text">Create a new Gig</p>
          <p className="caregiver-create-subtext">Add a new service offering</p>
        </div>

        {/* Active Gigs Limit Notice - Only show after eligibility has been checked */}
        {(activeTab === "paused" || activeTab === "draft") && !canPublishNewGig && eligibilityChecked && !statusHasErrors && (
          <div className="gig-limit-notice">
            {activeGigs.length >= 2 ? (
              <p>⚠️ You have reached the maximum of 2 active gigs. Pause an active gig to publish more.</p>
            ) : (
              <div>
                <p>⚠️ To publish gigs, you need to complete the following requirements:</p>
                <ul className="eligibility-requirements">
                  <li className={isVerified ? 'completed' : 'pending'}>
                    {isVerified ? '✅' : '❌'} Complete identity verification
                  </li>
                  <li className={isQualified ? 'completed' : 'pending'}>
                    {isQualified ? '✅' : '❌'} Pass qualification assessment
                  </li>
                  <li className={hasCertificates ? 'completed' : 'pending'}>
                    {hasCertificates ? '✅' : '❌'} Upload at least one certificate
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Active Tab Content */}
          {activeTab === "active" && activeGigs.map((gig) => (
            <div 
              key={gig.id} 
              className="caregiver-gig-card"
              onClick={() => navigate(`/service/${gig.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={gig.image1 || "https://via.placeholder.com/300x160"}
                alt={gig.title}
                className="caregiver-gig-image"
              />
              <div className="caregiver-gig-content">
                <h4 className="caregiver-gig-title">{gig.title}</h4>
                <p className="caregiver-gig-description">{gig.description}</p>
                <div className="caregiver-gig-actions">
                  {/* Active/published gigs should not be editable or deletable - only pauseable */}
                  {/* Clients may be viewing or booking these gigs, so changes should go through pause -> edit -> republish workflow */}
                  {/* <button 
                    className="caregiver-gig-action-btn caregiver-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGig(gig);
                    }}
                  >
                    Edit
                  </button> */}
                  <button 
                    className="caregiver-gig-action-btn caregiver-pause"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePauseGig(gig);
                    }}
                    disabled={pausingGigs.has(gig.id)}
                  >
                    {pausingGigs.has(gig.id) ? 'Pausing...' : 'Pause'}
                  </button>
                  {/* <button 
                    className="caregiver-gig-action-btn caregiver-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGig(gig);
                    }}
                    disabled={deletingGigs.has(gig.id)}
                  >
                    {deletingGigs.has(gig.id) ? 'Deleting...' : 'Delete'}
                  </button> */}
                </div>
              </div>
            </div>
          ))}

          {/* Paused Tab Content */}
          {activeTab === "paused" && pausedGigs.map((gig) => (
            <div 
              key={gig.id} 
              className="caregiver-gig-card"
              onClick={() => handleEditGig(gig)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={gig.image1 || "https://via.placeholder.com/300x160"}
                alt={gig.title}
                className="caregiver-gig-image"
              />
              <div className="caregiver-gig-content">
                <h4 className="caregiver-gig-title">{gig.title}</h4>
                <p className="caregiver-gig-description">{gig.description}</p>
                <div className="caregiver-gig-actions">
                  <button 
                    className="caregiver-gig-action-btn caregiver-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGig(gig);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className={`caregiver-gig-action-btn caregiver-publish ${!canPublishNewGig ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishGig(gig);
                    }}
                    disabled={publishingGigs.has(gig.id) || !canPublishNewGig}
                    title={!canPublishNewGig ? 
                      (activeGigs.length >= 2 ? 
                        'You can only have 2 active gigs. Pause an active gig first.' : 
                        'Complete verification, assessment, and upload certificates to publish gigs.'
                      ) : ''
                    }
                  >
                    {publishingGigs.has(gig.id) ? 'Publishing...' : 'Publish'}
                  </button>
                  <button 
                    className="caregiver-gig-action-btn caregiver-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGig(gig);
                    }}
                    disabled={deletingGigs.has(gig.id)}
                  >
                    {deletingGigs.has(gig.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Draft Tab Content */}
          {activeTab === "draft" && draftGigs.map((gig) => (
            <div 
              key={gig.id} 
              className="caregiver-gig-card"
              onClick={() => handleEditGig(gig)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={gig.image1 || "https://via.placeholder.com/300x160"}
                alt={gig.title}
                className="caregiver-gig-image"
              />
              <div className="caregiver-gig-content">
                <h4 className="caregiver-gig-title">{gig.title}</h4>
                <p className="caregiver-gig-description">{gig.description}</p>
                <div className="caregiver-gig-actions">
                  <button 
                    className="caregiver-gig-action-btn caregiver-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGig(gig);
                    }}
                  >
                    Continue Editing
                  </button>
                  <button 
                    className={`caregiver-gig-action-btn caregiver-publish ${!canPublishNewGig ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishGig(gig);
                    }}
                    disabled={publishingGigs.has(gig.id) || !canPublishNewGig}
                    title={!canPublishNewGig ? 
                      (activeGigs.length >= 2 ? 
                        'You can only have 2 active gigs. Pause an active gig first.' : 
                        'Complete verification, assessment, and upload certificates to publish gigs.'
                      ) : ''
                    }
                  >
                    {publishingGigs.has(gig.id) ? 'Publishing...' : 'Publish'}
                  </button>
                  <button 
                    className="caregiver-gig-action-btn caregiver-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGig(gig);
                    }}
                    disabled={deletingGigs.has(gig.id)}
                  >
                    {deletingGigs.has(gig.id) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Deleted Tab Content */}
          {activeTab === "deleted" && (
            deletedLoading ? (
              <div className="caregiver-spinner-container">
                <div className="caregiver-spinner" />
                <p>Loading deleted gigs...</p>
              </div>
            ) : deletedGigs.length === 0 ? (
              <div className="caregiver-empty-state">
                <h4>No Deleted Gigs</h4>
                <p>You don't have any recently deleted gigs.</p>
              </div>
            ) : (
              deletedGigs.map((gig) => {
                const daysLeft = gig.daysRemaining ?? 0;
                const isExpired = !gig.canRestore;
                const progressPct = Math.min(100, Math.round((daysLeft / 30) * 100));
                return (
                  <div
                    key={gig.id}
                    className={`caregiver-gig-card deleted-gig-card ${isExpired ? 'expired' : ''}`}
                  >
                    <img
                      src={gig.image1 || "https://via.placeholder.com/300x160"}
                      alt={gig.title}
                      className="caregiver-gig-image"
                    />
                    <div className="caregiver-gig-content">
                      <h4 className="caregiver-gig-title">{gig.title}</h4>
                      <p className="deleted-gig-category">{gig.category}</p>
                      {isExpired ? (
                        <p className="deleted-gig-status expired-text">Permanently deleted</p>
                      ) : (
                        <>
                          <p className="deleted-gig-status">
                            Deleted on {new Date(gig.deletedOn).toLocaleDateString()} &middot; {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                          </p>
                          <div className="deleted-gig-progress">
                            <div
                              className={`deleted-gig-progress-bar ${daysLeft <= 5 ? 'critical' : daysLeft <= 10 ? 'warning' : ''}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </>
                      )}
                      <div className="caregiver-gig-actions">
                        {!isExpired && (
                          <button
                            className="caregiver-gig-action-btn caregiver-restore"
                            onClick={() => handleRestoreGig(gig)}
                            disabled={restoringGigs.has(gig.id)}
                          >
                            {restoringGigs.has(gig.id) ? 'Restoring...' : 'Restore'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      )}
      
      {/* Toast Container */}
      <div className="caregiver-toast-container">
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
