import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientProfile.css';
import defaultAvatar from '../../../../assets/profilecard1.png';
import ClientProfileService from '../../../services/clientProfileService';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';
import OrderMetrics from '../../../components/client/OrderMetrics';
import AddressInput from '../../../components/AddressInput';
import { toast } from 'react-toastify';
import { generateUsername } from '../../../utils/usernameGenerator';

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

  // Address validation state
  const [addressValidation, setAddressValidation] = useState(null);

  // Care needs state
  const [careNeeds, setCareNeeds] = useState(null);
  const [hasCareNeeds, setHasCareNeeds] = useState(false);

  // Service category icons mapping
  const categoryIcons = {
    'Adult Care': '👴',
    'Child Care': '👶',
    'Pet Care': '🐕',
    'Home Care': '🏠',
    'Post Surgery Care': '🏥',
    'Special Needs Care': '♿',
    'Medical Support': '⚕️',
    'Mobility Support': '🦽',
    'Therapy & Wellness': '🧘',
    'Palliative': '🕊️'
  };

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

  // Fetch care needs from the care needs service
  useEffect(() => {
    const fetchCareNeeds = async () => {
      try {
        const needs = await ClientCareNeedsService.getCareNeeds();
        setCareNeeds(needs);
        setHasCareNeeds(!!(needs?.serviceCategories && needs.serviceCategories.length > 0));
      } catch (err) {
        console.warn('Could not fetch care needs:', err);
        setHasCareNeeds(false);
      }
    };
    fetchCareNeeds();
  }, []);

  // Generate username using the centralized utility
  const username = profile && profile.firstName && profile.email && profile.createdAt 
    ? generateUsername(profile.firstName, profile.email, profile.createdAt)
    : "guest000000";
  
  // Save username to localStorage
  useEffect(() => {
    if (username && username !== "guest000000") {
      localStorage.setItem("userName", username);
    }
  }, [username]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address change
  const handleAddressChange = (address) => {
    setEditedProfile(prev => ({
      ...prev,
      location: address
    }));
  };

  // Handle address validation
  const handleAddressValidation = (validation) => {
    setAddressValidation(validation);
    
    // Update profile with validated address if available
    if (validation && validation.isValid && validation.formattedAddress) {
      setEditedProfile(prev => ({
        ...prev,
        location: validation.formattedAddress,
        // Optionally store coordinates for future use
        coordinates: validation.coordinates
      }));
    }
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

  // Handle image selection (used during edit mode - just creates preview)
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

  // Handle direct image upload (used when NOT in edit mode - uploads immediately like settings page)
  const handleDirectImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      try {
        setUploadingImage(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
        }, 100);

        await ClientProfileService.updateProfilePicture(clientId, file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        toast.success('Profile picture updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });

        // Refresh profile data from API
        setTimeout(async () => {
          try {
            const refreshedProfile = await ClientProfileService.getProfile(clientId);
            
            console.log('Refreshed profile with picture URL:', refreshedProfile.profilePicture);
            
            // Add cache-busting timestamp to profile picture URL
            if (refreshedProfile.profilePicture) {
              refreshedProfile.profilePicture = `${refreshedProfile.profilePicture}?t=${Date.now()}`;
            }
            
            setProfile(refreshedProfile);
            setEditedProfile(refreshedProfile);

            // Update localStorage
            const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
            localStorage.setItem("userDetails", JSON.stringify({ ...userDetails, ...refreshedProfile }));
          } catch (err) {
            console.warn('Failed to refresh profile after image upload:', err);
          }
        }, 500);

        setTimeout(() => {
          setUploadingImage(false);
          setUploadProgress(0);
        }, 2000);
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error('Failed to update profile picture. Please try again.');
        setUploadingImage(false);
        setUploadProgress(0);
      }

      // Reset the input so the same file can be selected again
      e.target.value = '';
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
        
        console.log('Profile updated successfully with image:', updatedProfile); // Debug log
        
        // Update local state with API response or editedProfile as fallback
        const profileToSet = updatedProfile || editedProfile;
        setProfile(profileToSet);
        setEditedProfile(profileToSet); // Also update editedProfile to sync
        setIsEditing(false);
        setSelectedFile(null);
        setAddressValidation(null); // Clear address validation
        setSuccessMessage('Profile updated successfully!');
        
        // Update localStorage with new profile data
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        const updatedUserDetails = {
          ...userDetails,
          ...profileToSet
        };
        localStorage.setItem("userDetails", JSON.stringify(updatedUserDetails));
        
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Force refresh profile data from API after a short delay to ensure data persistence
        setTimeout(async () => {
          try {
            console.log('Refreshing profile data from API after image upload...');
            const refreshedProfile = await ClientProfileService.getProfile(clientId);
            console.log('Refreshed profile from API:', refreshedProfile);
            
            // Add cache-busting timestamp to profile picture URL
            if (refreshedProfile.profilePicture) {
              refreshedProfile.profilePicture = `${refreshedProfile.profilePicture}?t=${Date.now()}`;
            }
            
            setProfile(refreshedProfile);
            setEditedProfile(refreshedProfile);
          } catch (error) {
            console.warn('Failed to refresh profile from API:', error);
          }
        }, 1000); // Wait 1 second before refreshing
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
          setUploadingImage(false);
          setUploadProgress(0);
        }, 5000);
      } else {
        // Just update profile without image
        const updatedProfile = await ClientProfileService.updateProfile(clientId, editedProfile);
        
        console.log('Profile updated successfully:', updatedProfile); // Debug log
        
        // Update local state with API response or editedProfile as fallback
        const profileToSet = updatedProfile || editedProfile;
        setProfile(profileToSet);
        setEditedProfile(profileToSet); // Also update editedProfile to sync
        setIsEditing(false);
        setAddressValidation(null); // Clear address validation
        setSuccessMessage('Profile updated successfully!');
        
        // Update localStorage with new profile data
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        const updatedUserDetails = {
          ...userDetails,
          ...profileToSet
        };
        localStorage.setItem("userDetails", JSON.stringify(updatedUserDetails));
        
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Force refresh profile data from API after a short delay to ensure data persistence
        setTimeout(async () => {
          try {
            console.log('Refreshing profile data from API...');
            const refreshedProfile = await ClientProfileService.getProfile(clientId);
            console.log('Refreshed profile from API:', refreshedProfile);
            setProfile(refreshedProfile);
            setEditedProfile(refreshedProfile);
          } catch (error) {
            console.warn('Failed to refresh profile from API:', error);
          }
        }, 1000); // Wait 1 second before refreshing
        
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
    setAddressValidation(null);
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
          <div className="profile-picture-container" style={{ background: 'transparent' }}>
            {console.log('Profile picture URL:', profile?.profilePicture, 'Uploading:', uploadingImage)}
            <img 
              key={profile?.profilePicture} // Force re-render when URL changes
              src={isEditing ? editedProfile?.profilePicture || defaultAvatar : profile?.profilePicture || defaultAvatar}
              alt="Profile"
              className="large-profile-picture"
              onLoad={(e) => console.log('Image loaded successfully. Dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight, 'URL:', e.target.src)}
              onError={(e) => {
                console.error('Failed to load profile picture:', e.target.src);
                e.target.src = defaultAvatar;
              }}
              style={{ 
                display: 'block',
                background: 'transparent',
                position: 'relative',
                zIndex: 1,
                opacity: 1
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={isEditing ? handleImageSelect : handleDirectImageUpload}
            />
            <button 
              className="change-photo-btn"
              onClick={handleImageUploadClick}
              disabled={uploadingImage}
              style={{ zIndex: 10 }}
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
          </div>
          <div className="profile-status">
            <h3>{profile?.firstName} {profile?.middleName ? `${profile.middleName} ` : ''}{profile?.lastName}</h3>
            <p className="username">@{username}</p>
            
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
                    disabled
                    className="disabled-input"
                    title="First name cannot be changed"
                  />
                </div>
                
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={editedProfile?.middleName || ''}
                    onChange={handleChange}
                    placeholder="Enter your middle name (optional)"
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editedProfile?.lastName || ''}
                    disabled
                    className="disabled-input"
                    title="Last name cannot be changed"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedProfile?.email || ''}
                    disabled
                    className="disabled-input"
                    title="Email cannot be changed"
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
                  <AddressInput
                    value={editedProfile?.location || ''}
                    onChange={handleAddressChange}
                    onValidation={handleAddressValidation}
                    placeholder="Enter your full address (e.g., 123 Main Street, Lagos, Nigeria)"
                    className="client-profile-address-input"
                    showValidationIcon={true}
                    autoValidate={true}
                    country="ng"
                  />
                  
                  {/* Show validation status */}
                  {addressValidation && (
                    <div style={{ 
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: addressValidation.isValid ? '#d4edda' : '#f8d7da',
                      color: addressValidation.isValid ? '#155724' : '#721c24',
                      border: `1px solid ${addressValidation.isValid ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      <i className={`fas ${addressValidation.isValid ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                      {addressValidation.isValid ? 
                        ` Address validated: ${addressValidation.formattedAddress}` : 
                        ` ${addressValidation.errorMessage || 'Please select a valid address from suggestions'}`
                      }
                    </div>
                  )}
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
                  <p>{profile?.firstName} {profile?.middleName ? `${profile.middleName} ` : ''}{profile?.lastName}</p>
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
            {hasCareNeeds && careNeeds?.serviceCategories && (
              <div className="care-needs-details">
                <div className="care-needs-categories">
                  <label>Service Categories</label>
                  <div className="care-needs-tags">
                    {careNeeds.serviceCategories.map((cat) => (
                      <span key={cat} className="care-needs-tag">
                        {categoryIcons[cat] || '📋'} {cat}
                      </span>
                    ))}
                  </div>
                </div>
                {careNeeds.caregiverRequirements?.experienceLevel && (
                  <div className="care-needs-detail-row">
                    <label>Experience Level</label>
                    <p>{careNeeds.caregiverRequirements.experienceLevel}</p>
                  </div>
                )}
                {careNeeds.caregiverRequirements?.certifications?.length > 0 && (
                  <div className="care-needs-detail-row">
                    <label>Preferred Certifications</label>
                    <div className="care-needs-tags">
                      {careNeeds.caregiverRequirements.certifications.map((cert) => (
                        <span key={cert} className="care-needs-tag cert-tag">{cert}</span>
                      ))}
                    </div>
                  </div>
                )}
                {careNeeds.caregiverRequirements?.languages?.length > 0 && (
                  <div className="care-needs-detail-row">
                    <label>Languages</label>
                    <div className="care-needs-tags">
                      {careNeeds.caregiverRequirements.languages.map((lang) => (
                        <span key={lang} className="care-needs-tag lang-tag">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!hasCareNeeds && (
              <div className="care-needs-summary">
                <p className="care-needs-description">
                  You haven't specified your care needs yet.
                </p>
              </div>
            )}
            <div className="care-needs-summary">
              <button 
                className="care-needs-btn"
                onClick={() => navigate('/app/client/care-needs?returnTo=/app/client/profile')}
              >
                <i className={hasCareNeeds ? "fas fa-edit" : "fas fa-plus-circle"}></i>
                {hasCareNeeds ? 'Edit Care Needs' : 'Set Care Needs'}
              </button>
            </div>
          </div>
          
          {/* <div className="profile-section">
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
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
