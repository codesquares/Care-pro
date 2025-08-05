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
    
    try {
      setLocationLoading(true);
      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverAboutMeInfo/${userDetails.id}?location=${encodeURIComponent(editedLocation)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update location. Status: ${response.status}`);
      }

      setProfile(prev => ({ ...prev, location: editedLocation }));
      setShowLocationModal(false);
      console.log("Location updated successfully");
    } catch (err) {
      console.error("Failed to update location:", err);
      alert("Failed to update location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "null");

      console.log("ProfileHeader rendered - caregiverId:", userDetails?.id);
      console.log("Current userDetails:", userDetails);

      if (!userDetails || !userDetails.id) {
        if (isMountedRef.current) {
          setError("No user details found. Please log in.");
          setIsLoading(false);
        }
        return;
      }

      const caregiverId = userDetails.id;
      console.log("Starting profile fetch, caregiverId:", caregiverId);

      try {
        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${caregiverId}`
        );

        console.log("API response status:", response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch profile. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Profile data received:", data);

        // Format the member since date
        const formattedDate = data.createdAt 
          ? new Date(data.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : "N/A";

        const transformedData = {
          picture: data.profileImage || profilecard1,
          name: `${data.firstName} ${data.lastName}`,
          username: data.email?.split("@")[0] || "unknown",
          bio: data.bio || `${data.firstName} is a caregiver on CarePro`,
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          location: data.location || "N/A",
          memberSince: formattedDate,
          lastDelivery: data.lastDelivery || "N/A",
          introVideo: data.introVideo || "",
          aboutMe: data.aboutMe || "N/A",
          services: data.services || [],
          status: data.status || false,
          isAvailable: data.isAvailable || false,
          // Use verification status from cached data or default to unverified
          verificationStatus: "unverified",
        };

        const cachedStatus = verificationService.getCachedVerificationStatus(
          caregiverId,
          "caregiver"
        );
        transformedData.verificationStatus =
          cachedStatus?.verificationStatus || "unverified";

        if (isMountedRef.current) {
          setProfile(transformedData);
          setEditedLocation(transformedData.location);
          setIsLoading(false);
          console.log("Profile state updated, isLoading set to false");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (isMountedRef.current) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    console.log("Effect running, initiating profile fetch");
    fetchProfile();
  }, []); // only once

  if (isLoading) {
    console.log("Rendering loading state");
    return <div>Loading...</div>;
  }

  if (error) {
    console.log("Rendering error state:", error);
    return <div>{error}</div>;
  }

  if (!profile) {
    console.log("Rendering no profile state");
    return <div>No profile found.</div>;
  }

 
  //get userName from localStorage
  const userName = localStorage.getItem("userName") || "guestUser209";

  const headerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
    maxWidth: "100%"
  };

  const imageStyle = {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    margin: "0 auto 15px auto",
    border: "3px solid #e0e0e0",
  };

  const profileInfoStyle = {
    padding: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "#fff",
    marginBottom: "20px",
    width: "100%",
    maxWidth: "400px"
  };

   console.log("Rendering profile component with data========>:", profile);

  return (
    <div className="profile-header" style={headerStyle}>
      <div style={profileInfoStyle}>
        <img
          src={profile.picture}
          alt="Profile"
          className="profile-img"
          style={imageStyle}
        />
        <h2 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "24px", 
          fontWeight: "600",
          color: "#333"
        }}>{profile.name}</h2>
        <p style={{ 
          margin: "0 0 8px 0", 
          fontSize: "14px",
          color: "#666" 
        }}>@{userName}</p>
        <p style={{ 
          margin: "0 0 15px 0", 
          fontSize: "14px", 
          lineHeight: "1.5",
          color: "#666",
          maxWidth: "90%" 
        }}>{profile.bio}</p>
        
        <div style={{ 
          margin: "15px 0", 
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px"
        }}>
          <span style={{ color: "#ffc107" }}>
            {"⭐".repeat(Math.round(profile.rating))}
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>
            ({profile.rating}, {profile.reviews} Reviews)
          </span>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          margin: "15px 0",
          width: "100%"
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px"
          }}>
            <p style={{ 
              margin: "0", 
              fontSize: "14px",
              color: "#666"
            }}>📍 {profile.location}</p>
            <button 
              onClick={() => setShowLocationModal(true)}
              style={{
                padding: '8px 16px',
                border: '1px solid #007bff',
                borderRadius: '6px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '150px',
                height: '36px',
                width: '150px'
              }}
            >
              Edit Location
            </button>
          </div>
          <p style={{ 
            margin: "0", 
            fontSize: "14px",
            color: "#666",
            textAlign: "center"
          }}>📅 Member since: {profile.memberSince}</p>
          <p style={{ 
            margin: "0", 
            fontSize: "14px",
            color: "#666",
            textAlign: "center"
          }}>📦 Last Delivery: {profile.lastDelivery}</p>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          margin: "10px 0 15px 0"
        }}>
          <div style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            backgroundColor: profile.isAvailable ? "#d4edda" : "#f8d7da",
            color: profile.isAvailable ? "#155724" : "#721c24",
            border: `1px solid ${profile.isAvailable ? "#c3e6cb" : "#f5c6cb"}`,
            width: "150px",
            textAlign: "center"
          }}>
            {profile.isAvailable ? "Available" : "Unavailable"}
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
          width: "100%"
        }}>
          <VerifyButton verificationStatus={profile.verificationStatus} />
        </div>
      </div>

      <IntroVideo profileIntrovideo={profile.introVideo} />
      <ProfileInformation profileDescription = {profile.aboutMe} services={profile.services}
      onUpdate={(newAboutMe) => setProfile(prev => ({ ...prev, aboutMe: newAboutMe }))}
      />
        
      
      {/* Development Tool for Testing - Remove in Production */}
      {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}

      {/* Location Edit Modal */}
      {showLocationModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "400px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: "0 0 15px 0", 
              fontSize: "18px", 
              fontWeight: "600",
              color: "#333"
            }}>Edit Location</h3>
            <input
              type="text"
              value={editedLocation}
              onChange={(e) => setEditedLocation(e.target.value)}
              placeholder="Enter your location"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "15px",
                boxSizing: "border-box"
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowLocationModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLocationSave}
                disabled={locationLoading}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: locationLoading ? "#ccc" : "#007bff",
                  color: "white",
                  cursor: locationLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >
                {locationLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default ProfileHeader;
