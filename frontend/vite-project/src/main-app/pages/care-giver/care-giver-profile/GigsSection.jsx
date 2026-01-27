import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import config from "../../../config"; // Import centralized config for API URLs

import clock from "../../../../assets/main-app/clock.png"; // Ensure you have an empty gigs image in your assets
import Toast from "../../../components/toast/Toast";
import useToast from "../../../hooks/useToast";
import { useGigEdit } from "../../../contexts/GigEditContext";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import "./gigs-section.css";

const GigsSection = () => {
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingGigs, setPublishingGigs] = useState(new Set());
  const [pausingGigs, setPausingGigs] = useState(new Set());
  const [deletingGigs, setDeletingGigs] = useState(new Set());
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = "/app/caregiver";
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const { populateFromGig, resetForm } = useGigEdit();
  const { canPublishGigs, isVerified, isQualified, hasCertificates, isLoading: statusLoading, eligibilityChecked } = useCaregiverStatus();

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

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${config.BASE_URL}/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`, // Using centralized API config
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'published',
            caregiverId: userDetails.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to publish gig');
      }

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

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${config.BASE_URL}/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`, // Using centralized API config
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'draft',
            caregiverId: userDetails.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to pause gig');
      }

      // Update the gig status in local state
      setGigs(prevGigs => 
        prevGigs.map(g => 
          g.id === gig.id 
            ? { ...g, status: 'draft' }
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

  const handleDeleteGig = async (gig) => {
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${gig.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Add gig to deleting set to show loading state
      setDeletingGigs(prev => new Set(prev).add(gig.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${config.BASE_URL}/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`, // Using centralized API config
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: '',
            caregiverId: userDetails.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete gig');
      }

      // Remove the gig from local state
      setGigs(prevGigs => prevGigs.filter(g => g.id !== gig.id));

      showSuccess('Gig deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting gig:', err);
      showError('Failed to delete gig. Please try again.');
    } finally {
      // Remove gig from deleting set
      setDeletingGigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(gig.id);
        return newSet;
      });
    }
  };

  // Filter gigs based on status
  const activeGigs = useMemo(() => {
    return gigs.filter(gig => gig.status?.toLowerCase() === 'published');
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

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${config.BASE_URL}/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`, // Using centralized API config
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch gigs data.");
      }

      const data = await response.json();
      setGigs(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Fetch gigs on mount and when returning from edit page
  useEffect(() => {
    fetchGigs();
    
    // Clear the navigation state after using it
    if (location.state?.refreshGigs) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.refreshGigs]);

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
          Paused Gigs ({draftGigs.length})
        </button>
      </div>

      {/* No Gigs State */}
      {activeGigs.length === 0 && draftGigs.length === 0 ? (
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
        {activeTab === "paused" && !canPublishNewGig && eligibilityChecked && (
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
                    className="caregiver-gig-action-btn caregiver-pause"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePauseGig(gig);
                    }}
                    disabled={pausingGigs.has(gig.id)}
                  >
                    {pausingGigs.has(gig.id) ? 'Pausing...' : 'Pause'}
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

          {/* Paused Tab Content */}
          {activeTab === "paused" && draftGigs.map((gig) => (
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
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default GigsSection;
