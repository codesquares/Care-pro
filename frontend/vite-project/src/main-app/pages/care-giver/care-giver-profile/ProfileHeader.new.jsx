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
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // Add a ref to track if component is still mounted
  const isMountedRef = useRef(true);

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const caregiverId = userDetails?.id;
  // get userName from localStorage
  const userName = localStorage.getItem("userName") || "guestUser209";
  console.log("userName===>", userName);
  useEffect(() => {
    // Set up cleanup function for when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Use a flag to prevent multiple loads
    let isLoaded = false;

    const fetchProfile = async () => {
      if (isLoaded) return;
      isLoaded = true;

      if (!caregiverId) {
        if (isMountedRef.current) {
          setError("No caregiver ID found.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${caregiverId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile.");
        }

        const data = await response.json();

        // Default to unverified so the verification button shows up properly
        let verificationStatusValue = "unverified";

        try {
          // First check the user-specific verification status
          const userSpecificKey = `verificationStatus_caregiver_${caregiverId}`;
          const cachedUserSpecific = localStorage.getItem(userSpecificKey);
          
          // Then fall back to the general verification status
          const cachedGeneral = localStorage.getItem("verificationStatus");
          
          // Use the user-specific cache if available, otherwise use general cache
          const cached = cachedUserSpecific || cachedGeneral;
          
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.verified) {
              verificationStatusValue = "verified";
            } else if (parsed?.verificationStatus) {
              // Use the status from cache (pending, failed, etc.)
              verificationStatusValue = parsed.verificationStatus;
            }
          }

          // In ProfileHeader, we should avoid checking with the server on every render 
          // to prevent infinite loops. Instead, we'll use the cached version from localStorage.
          // The verification page will handle full server verification checks.
        } catch (verificationError) {
          console.warn("Verification check failed:", verificationError);
        }

        const createdAt = new Date(data.createdAt);
        const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setProfile({
            name: `${data.firstName} ${data.lastName}`,
            username: data.email,
            bio: data.introduction || "Interested in giving the best healthcare services to your taste?",
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            location: data.location || "N/A",
            memberSince: formattedDate,
            lastDelivery: data.lastDelivery || "N/A",
            picture: data.picture || profilecard1,
            introVideo: data.introVideo || "",
            aboutMe: data.aboutMe || "",
            status: data.status || false,
            verificationStatus: verificationStatusValue,
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (isMountedRef.current) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [caregiverId]); // Only run once per ID

  if (isLoading) return <p>Loading...</p>;
  if (error || !profile) return <p>Error: {error}</p>;

  // Create styles for centered vertical layout
  const headerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px'
  };

  const imageStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    margin: '0 auto 15px auto',
    border: '3px solid #f0f0f0'
  };

  const sectionStyle = {
    margin: '10px 0',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  return (
    <>
      <div className="profile-header" style={headerStyle}>
        <img 
          src={profile.picture} 
          alt="Profile" 
          className="profile-img" 
          style={imageStyle}
        />
        <h2 style={{ margin: '10px 0 5px 0' }}>{profile.name}</h2>
        <p style={{ margin: '5px 0', color: '#666' }}>@{userName}</p>
        <p style={{ margin: '8px 0 12px 0', maxWidth: '90%' }}>{profile.bio}</p>
        <div className="rating" style={{ margin: '10px 0', fontSize: '16px' }}>
          {"⭐".repeat(Math.round(profile.rating))} ({profile.rating}, {profile.reviews} Reviews)
        </div>
        <div className="details" style={sectionStyle}>
          <p style={{ margin: '5px 0' }}>📍 {profile.location}</p>
          <p style={{ margin: '5px 0' }}>📅 Member since: {profile.memberSince}</p>
          <p style={{ margin: '5px 0' }}>📦 Last Delivery: {profile.lastDelivery}</p>
        </div>
        <button 
          className={`availability-btn ${profile.status ? 'available' : 'unavailable'}`}
          style={{ margin: '15px 0', padding: '8px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          {profile.status ? "Available" : "Unavailable"}
        </button>
        <div className="button-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          alignItems: 'center', 
          width: '100%', 
          marginTop: '10px' 
        }}>
          <VerifyButton verificationStatus={profile.verificationStatus} />
          <AssessmentButton verificationStatus={profile.verificationStatus} />
        </div>
      </div>

      <IntroVideo profileIntrovideo={profile.introVideo} />
      <ProfileInformation profileDescription={profile.aboutMe} />

      {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}
    </>
  );
};

export default ProfileHeader;
