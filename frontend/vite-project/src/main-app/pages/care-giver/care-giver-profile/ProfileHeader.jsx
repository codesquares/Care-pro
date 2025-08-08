import React, { useEffect, useState, useRef } from "react";
import "./profile-header.css";
import profilecard1 from "../../../../assets/profilecard1.png";
import IntroVideo from "./IntroVideo";
import ProfileInformation from "./ProfileInformation";
import VerifyButton from "./VerifyButton";
import AssessmentButton from "./AssessmentButton";
import TestVerificationToggle from "../../../components/dev/TestVerificationToggle";
import verificationService from "../../../services/verificationService";

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
      alert("Please enter a location");
      return;
    }

    try {
      setLocationLoading(true);
      
      // API call to update location
      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverLocation/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: editedLocation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Update local state
      setProfile(prev => ({ ...prev, location: editedLocation }));
      setShowLocationModal(false);
      setEditedLocation("");
      
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDetailsStr = localStorage.getItem("userDetails");
        if (!userDetailsStr) {
          console.warn("No userDetails found in localStorage");
          setError("User not logged in");
          setIsLoading(false);
          return;
        }

        let userDetails;
        try {
          userDetails = JSON.parse(userDetailsStr);
        } catch (parseErr) {
          console.error("Error parsing userDetails:", parseErr);
          setError("Invalid user session");
          setIsLoading(false);
          return;
        }

        if (!userDetails?.id) {
          console.warn("No user ID found in userDetails");
          setError("Invalid user session");
          setIsLoading(false);
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

        setProfile({
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
          verificationStatus: "verified", // Temporarily set to verified for testing
          isAvailable: data.isAvailable || false,
        });
        
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (isMountedRef.current) {
          setError("Failed to load profile data");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

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
          <img
            src={profile.picture}
            alt="Profile"
            className="caregiver-profile-img"
          />
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

      <IntroVideo profileIntrovideo={profile.introVideo} />
      <ProfileInformation 
        profileDescription={profile.aboutMe} 
        services={profile.services}
        onUpdate={(newAboutMe) => setProfile(prev => ({ ...prev, aboutMe: newAboutMe }))}
      />
    </div>
  );
};

export default ProfileHeader;
