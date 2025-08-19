import React, { useEffect, useState, useRef } from "react";
import "./profile-header.css";
import profilecard1 from "../../../../assets/profilecard1.png";
import IntroVideo from "./IntroVideo";
import ProfileInformation from "./ProfileInformation";
import VerifyButton from "./VerifyButton";
import AssessmentButton from "./AssessmentButton";
import TestVerificationToggle from "../../../components/dev/TestVerificationToggle";
import verificationService from "../../../services/verificationService";
import { toast } from "react-toastify";

const ProfileHeader = () => {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    bio: "",
    rating: 0,
    reviews: 0,
    location: "",
    memberSince: "",
    lastDelivery: "",
    picture: "",
    introVideo: "",
    aboutMe: "",
    services:[],
    status: false,
    verificationStatus: null,
    isAvailable: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editedLocation, setEditedLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    console.log("MOUNTED ProfileHeader");
    return () => console.log("UNMOUNTED ProfileHeader");
  }, []);

  const handleLocationSave = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    
    if (!editedLocation.trim()) {
      toast.warning("Please enter a location");
      return;
    }

    try {
      setLocationLoading(true);
      
      // API call to update location using the correct endpoint with query parameter
      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverAboutMeInfo/${userDetails.id}?Location=${encodeURIComponent(editedLocation)}`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'multipart/form-data',
        },
        body: new FormData().append('IntroVideo', ''),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // API returns plain text message, not JSON
      const result = await response.text();
      console.log('Location update response:', result);

      // Call fetchProfile to get updated profile data
      await fetchProfile(true);

      setShowLocationModal(false);
      setEditedLocation("");
      
      toast.success('Location updated successfully!');
      
    } catch (err) {
      console.error('Error updating location:', err);
      toast.error('Failed to update location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB');
      return;
    }

    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (!userDetails?.id) {
      toast.error('User session expired. Please log in again.');
      return;
    }

    try {
      setImageUploadLoading(true);

      const formData = new FormData();
      formData.append('ProfileImage', file);

      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateProfilePicture/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile picture');
      }

      // API returns plain text message, not JSON
      const result = await response.text();
      console.log('Upload response:', result);
      
      // Call fetchProfile to get updated profile data with new image
      // Skip loading states since we're already in upload loading state
      await fetchProfile(true);

      toast.success('Profile picture updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile picture:', err);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setImageUploadLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const fetchProfile = async (skipLoadingStates = false) => {
    try {
      if (!skipLoadingStates) {
        setIsLoading(true);
      }

      const userDetailsStr = localStorage.getItem("userDetails");
      if (!userDetailsStr) {
        console.warn("No userDetails found in localStorage");
        setError("User not logged in");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      let userDetails;
      try {
        userDetails = JSON.parse(userDetailsStr);
      } catch (parseErr) {
        console.error("Error parsing userDetails:", parseErr);
        setError("Invalid user session");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      if (!userDetails?.id) {
        console.warn("No user ID found in userDetails");
        setError("Invalid user session");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      console.log("Fetching profile for user ID:", userDetails.id);
      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`);
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched caregiver data:", data);

      if (!isMountedRef.current) return;

      // Get verification status
      let verificationStatus = null;
      try {
        verificationStatus = await verificationService.getVerificationStatus(userDetails.id);
      } catch (verErr) {
        console.warn("Failed to fetch verification status:", verErr);
      }

      const updatedProfile = {
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : "John Doe",
        username: data.email || "user@example.com",
        bio: data.aboutMe || "Passionate caregiver dedicated to providing quality care.",
        rating: data.rating || 4.8,
        reviews: data.reviewsCount || 24,
        location: data.location || "New York, NY",
        memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "January 2023",
        lastDelivery: data.lastDelivery ? new Date(data.lastDelivery).toLocaleDateString() : "2 days ago",
        picture: data.profileImage || profilecard1,
        introVideo: data.introVideo || "",
        aboutMe: data.aboutMe || "",
        services: data.services || [],
        status: data.status || false,
        verificationStatus: verificationStatus, // Temporarily set to verified for testing
        isAvailable: data.isAvailable || false,
      };

      console.log("Updated profile with new image:", updatedProfile.picture);
      setProfile(updatedProfile);
      
    } catch (err) {
      console.error("Failed to load profile:", err);
      if (isMountedRef.current) {
        setError("Failed to load profile data");
      }
    } finally {
      if (isMountedRef.current && !skipLoadingStates) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="caregiver-profile-header-card">
        <div className="caregiver-loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="caregiver-profile-header-card">
        <div className="caregiver-error-message">{error}</div>
      </div>
    );
  }

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const userName = localStorage.getItem("userName");

  console.log("Rendering profile component with data========>:", profile);

  return (
    <div className="caregiver-profile-header">
      <div className="caregiver-profile-header-card">
        <div className="caregiver-profile-basic-info">
          <div className="caregiver-profile-img-container">
            <img
              src={profile.picture}
              alt="Profile"
              className="caregiver-profile-img"
            />
            <button 
              onClick={triggerImageUpload}
              disabled={imageUploadLoading}
              className="caregiver-profile-img-upload-btn"
              title="Update profile picture"
            >
              {imageUploadLoading ? (
                <span className="caregiver-upload-spinner">⟳</span>
              ) : (
                <span className="caregiver-upload-plus">+</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <h2>{profile.name}</h2>
          {userName && <p className="caregiver-username">@{userName}</p>}
          <p className="caregiver-bio">{profile.bio}</p>
        </div>
      
        <div className="caregiver-profile-rating-section">
          <div className="caregiver-rating">
            <span className="caregiver-stars">
              {"⭐".repeat(Math.round(profile.rating))}
            </span>
            <span className="caregiver-rating-text">
              ({profile.rating}, {profile.reviews} Reviews)
            </span>
          </div>
        </div>

        <div className="caregiver-profile-details">
          <div className="caregiver-detail-item">
            <span className="caregiver-detail-label">📍 Location</span>
            <span className="caregiver-detail-value">{profile.location}</span>
          </div>
          <div className="caregiver-detail-item">
            <span className="caregiver-detail-label">📅 Member since</span>
            <span className="caregiver-detail-value">{profile.memberSince}</span>
          </div>
          <div className="caregiver-detail-item">
            <span className="caregiver-detail-label">� Last delivery</span>
            <span className="caregiver-detail-value">{profile.lastDelivery}</span>
          </div>
          <button 
            onClick={() => setShowLocationModal(true)}
            className="caregiver-edit-location-btn"
          >
            Edit Location
          </button>
        </div>

        <div className="caregiver-profile-actions">
          <VerifyButton 
            verificationStatus={profile.verificationStatus} 
            userId={userDetails?.id}
          />
          <AssessmentButton userId={userDetails?.id} />
        </div>

        {/* Development Tool for Testing - Remove in Production */}
        {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}

        {/* Location Edit Modal */}
        {showLocationModal && (
          <div 
            className="caregiver-location-modal-overlay"
            onClick={() => setShowLocationModal(false)}
          >
            <div 
              className="caregiver-location-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Location</h3>
              <input
                type="text"
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                placeholder="Enter new location"
                className="caregiver-location-input"
              />
              <div className="caregiver-modal-buttons">
                <button 
                  onClick={() => setShowLocationModal(false)}
                  className="caregiver-modal-btn caregiver-modal-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLocationSave}
                  disabled={locationLoading}
                  className="caregiver-modal-btn caregiver-modal-save"
                >
                  {locationLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <IntroVideo 
        profileIntrovideo={profile.introVideo} 
        onVideoUpdate={() => fetchProfile(true)}
      />
      <ProfileInformation 
        profileDescription={profile.aboutMe} 
        services={profile.services}
        onUpdate={(newAboutMe) => setProfile(prev => ({ ...prev, aboutMe: newAboutMe }))}
      />
    </div>
  );
};

export default ProfileHeader;
