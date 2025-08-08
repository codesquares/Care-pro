import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../../../components/EmptyState"; 
import clock from "../../../../assets/main-app/clock.png"; // Ensure you have an empty gigs image in your assets
import Toast from "../../../components/toast/Toast";
import useToast from "../../../hooks/useToast";
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
  const basePath = "/app/caregiver";
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleNavigateToCreateGig = () => {
    navigate(`${basePath}/create-gigs`);
  };

  const handleEditGig = (gig) => {
    navigate(`${basePath}/create-gigs`, {
      state: { 
        gigData: gig, 
        editMode: true 
      }
    });
  };

  const handlePublishGig = async (gig) => {
    try {
      // Add gig to publishing set to show loading state
      setPublishingGigs(prev => new Set(prev).add(gig.id));

      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      if (!userDetails?.id) {
        throw new Error("Caregiver ID not found in local storage.");
      }

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/UpdateGigStatusToPause/gigId?gigId=${gig.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          throw new Error("Caregiver ID not found in local storage.");
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`
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

    fetchGigs();
  }, []);

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

          {/* Active Tab Content */}
          {activeTab === "active" && activeGigs.map((gig) => (
            <div key={gig.id} className="caregiver-gig-card">
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
                    onClick={() => handleEditGig(gig)}
                  >
                    Edit
                  </button>
                  <button 
                    className="caregiver-gig-action-btn caregiver-pause"
                    onClick={() => handlePauseGig(gig)}
                    disabled={pausingGigs.has(gig.id)}
                  >
                    {pausingGigs.has(gig.id) ? 'Pausing...' : 'Pause'}
                  </button>
                  <button 
                    className="caregiver-gig-action-btn caregiver-delete"
                    onClick={() => handleDeleteGig(gig)}
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
            <div key={gig.id} className="caregiver-gig-card">
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
                    onClick={() => handleEditGig(gig)}
                  >
                    Edit
                  </button>
                  <button 
                    className="caregiver-gig-action-btn caregiver-publish"
                    onClick={() => handlePublishGig(gig)}
                    disabled={publishingGigs.has(gig.id)}
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
