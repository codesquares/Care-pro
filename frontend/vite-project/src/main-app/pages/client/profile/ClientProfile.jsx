import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientProfile.css';
import defaultAvatar from '../../../../assets/profilecard1.png';
import ClientProfileService from '../../../services/clientProfileService';
import OrderMetrics from '../../../components/client/OrderMetrics';
import { toast } from 'react-toastify';

/**
 * Enhanced Premium Client Profile Page Component
 * 
 * Displays detailed information about the client's profile
 * and allows them to update their profile information
 */
const ClientProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // File upload ref
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get user details from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const clientId = userDetails?.id;

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!clientId) {
          throw new Error("Client ID not found");
        }
        
        setLoading(true);
        const data = await ClientProfileService.getProfile(clientId);
        setProfile(data);
        setEditedProfile(data);
      } catch (error) {
        setError(error.message);
        toast.error("Failed to load profile information", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [clientId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setEditedProfile(prev => ({
          ...prev,
          profilePicture: fileReader.result
        }));
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  // Handle image upload click
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // Handle profile update with progress indicator
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Simulate upload progress
      if (selectedFile) {
        setUploadingImage(true);
        setUploadProgress(0);
        
        const intervalId = setInterval(() => {
          setUploadProgress(prevProgress => {
            const newProgress = prevProgress + 5;
            return newProgress >= 90 ? 90 : newProgress;
          });
        }, 100);
        
        // First, update the profile information
        const updatedProfile = await ClientProfileService.updateProfile(clientId, editedProfile);
        
        // If there's a selected file, upload the profile picture
        await ClientProfileService.updateProfilePicture(clientId, selectedFile);
        
        // Complete the progress bar
        clearInterval(intervalId);
        setUploadProgress(100);
        
        // Update local state
        setProfile(updatedProfile);
        setIsEditing(false);
        setSelectedFile(null);
        setSuccessMessage('Profile updated successfully!');
        
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
          setUploadingImage(false);
          setUploadProgress(0);
        }, 5000);
      } else {
        // Just update profile without image
        const updatedProfile = await ClientProfileService.updateProfile(clientId, editedProfile);
        
        // Update local state
        setProfile(updatedProfile);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setUploadingImage(false);
      setUploadProgress(0);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadingImage(false);
  };

  if (loading) {
    return (
      <div className="client-profile-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-profile-container error">
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button 
          className="edit-profile-btn"
          onClick={() => navigate('/app/client/dashboard')}
        >
          <i className="fas fa-arrow-left"></i> Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="client-profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing ? (
          <button 
            className="edit-profile-btn"
            onClick={() => setIsEditing(true)}
          >
            <i className="fas fa-edit"></i> Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="cancel-btn"
              onClick={handleCancel}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-picture-container">
            <img
              src={isEditing ? editedProfile?.profilePicture || defaultAvatar : profile?.profilePicture || defaultAvatar}
              alt="Profile"
              className="large-profile-picture"
            />
            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <button 
                  className="change-photo-btn"
                  onClick={handleImageUploadClick}
                  disabled={uploadingImage}
                >
                  <i className={uploadingImage ? "fas fa-spinner fa-spin" : "fas fa-camera"}></i>
                </button>
                
                {uploadingImage && (
                  <div className="upload-progress-container">
                    <div className="upload-progress">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${uploadProgress}%`, 
                          backgroundColor: uploadProgress < 100 ? 'var(--primary)' : 'var(--accent)' 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="profile-status">
            <h3>{profile?.firstName} {profile?.lastName}</h3>
            <p className="username">@{profile?.username || profile?.email?.split('@')[0]}</p>
            
            <div className="verification-status">
              <span className={`status-indicator ${profile?.isVerified ? 'verified' : 'not-verified'}`}></span>
              <span>{profile?.isVerified ? 'Verified Account' : 'Verification Pending'}</span>
            </div>
            
            <div className="member-since">
              <p><strong>Member Since:</strong> {formatDate(profile?.createdAt || new Date())}</p>
            </div>
          </div>
        </div>

        <div className="profile-details-container">
          <div className="profile-section">
            <h2>Personal Information</h2>
            
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editedProfile?.firstName || ''}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editedProfile?.lastName || ''}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedProfile?.email || ''}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editedProfile?.phoneNumber || ''}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editedProfile?.location || ''}
                    onChange={handleChange}
                    placeholder="Enter your location"
                  />
                </div>
                
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={editedProfile?.bio || ''}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell caregivers a bit about yourself..."
                  />
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{profile?.firstName} {profile?.lastName}</p>
                </div>
                
                <div className="info-item">
                  <label>Email</label>
                  <p>{profile?.email || 'Not provided'}</p>
                </div>
                
                <div className="info-item">
                  <label>Phone Number</label>
                  <p>{profile?.phoneNumber || 'Not provided'}</p>
                </div>
                
                <div className="info-item">
                  <label>Location</label>
                  <p>{profile?.location || 'Not specified'}</p>
                </div>
                
                <div className="info-item bio">
                  <label>Bio</label>
                  <p>{profile?.bio || 'No bio provided yet.'}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="profile-section">
            <h2>Services History</h2>
            <div className="services-summary">
              <div className="summary-item">
                <span className="count">0</span>
                <span className="label">Active Services</span>
              </div>
              
              <div className="summary-item">
                <span className="count">0</span>
                <span className="label">Completed Services</span>
              </div>
              
              <div className="summary-item">
                <span className="count">0</span>
                <span className="label">Favorites</span>
              </div>
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Spending Overview</h2>
            {/* OrderMetrics component to display spending data */}
            <OrderMetrics clientId={clientId} />
          </div>
          
          <div className="profile-section">
            <h2>Care Needs</h2>
            <div className="care-needs-summary">
              <p className="care-needs-description">
                {profile?.careNeeds ? 'Your care needs are configured.' : 'You haven\'t specified your care needs yet.'}
              </p>
              <button 
                className="care-needs-btn"
                onClick={() => navigate('/app/client/care-needs')}
              >
                <i className={profile?.careNeeds ? "fas fa-edit" : "fas fa-plus-circle"}></i>
                {profile?.careNeeds ? 'Update Care Needs' : 'Set Care Needs'}
              </button>
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Quick Actions</h2>
            <div className="profile-actions">
              <button 
                className="action-button"
                onClick={() => navigate('/app/client/settings')}
              >
                <i className="fas fa-cog"></i>
                <span>Account Settings</span>
              </button>
              
              <button 
                className="action-button"
                onClick={() => navigate('/app/client/verification')}
              >
                <i className="fas fa-check-circle"></i>
                <span>Verification Status</span>
              </button>
              
              <button 
                className="action-button"
                onClick={() => navigate('/app/client/my-order')}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>View Orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
