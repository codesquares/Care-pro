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
          picture: data.profilePicture || profilecard1,
          name: `${data.firstName} ${data.lastName}`,
          username: data.email?.split("@")[0] || "unknown",
          bio: data.bio || `${data.firstName} is a caregiver on CarePro`,
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          location: data.location || "N/A",
          memberSince: formattedDate,
          lastDelivery: data.lastDelivery || "N/A",
          picture: data.picture || profilecard1,
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

  console.log("Rendering profile component with data:", profile);
  //get userName from localStorage
  const userName = localStorage.getItem("userName") || "guestUser209";

  const headerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
  };

  const imageStyle = {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    margin: "0 auto 15px auto",
    border: "3px solid #f0f0f0",
  };

  const sectionStyle = {
    margin: "10px 0",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  return (
        
      <div className="profile-header" style={headerStyle}>
        <img
          src={profile.picture}
          alt="Profile"
          className="profile-img"
          style={imageStyle}
        />
        <h2 style={{ margin: "10px 0 5px 0" }}>{profile.name}</h2>
        <p style={{ margin: "5px 0", color: "#666" }}>@{userName}</p>
        <p style={{ margin: "8px 0 12px 0", maxWidth: "90%" }}>{profile.bio}</p>
        <div className="rating" style={{ margin: "10px 0", fontSize: "16px" }}>
          {"⭐".repeat(Math.round(profile.rating))} ({profile.rating},{" "}
          {profile.reviews} Reviews)
        </div>
        <div className="details" style={sectionStyle}>
          <p style={{ margin: "5px 0" }}>📍 {profile.location}</p>
          <p style={{ margin: "5px 0" }}>📅 Member since: {profile.memberSince}</p>
          <p style={{ margin: "5px 0" }}>
            📦 Last Delivery: {profile.lastDelivery}
          </p>
        </div>
        <div className={`availability-btn ${profile.isAvailable ? 'available' : 'unavailable'}`}>
          {profile.isAvailable ? "Available" : "Unavailable"}
        </div>
        <div className="button-container">
        <button
          className={`availability-btn ${profile.status ? "available" : "unavailable"}`}
          style={{
            margin: "15px 0",
            padding: "8px 20px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {profile.status ? "Available" : "Unavailable"}
        </button>
        <div
          className="button-container"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
            width: "100%",
            marginTop: "10px",
          }}
        >
          <VerifyButton verificationStatus={profile.verificationStatus} />
          <AssessmentButton verificationStatus={profile.verificationStatus} />
        </div>
      </div>

      <IntroVideo profileIntrovideo={profile.introVideo} />
      <ProfileInformation profileDescription = {profile.aboutMe} services={profile.services}
      onUpdate={(newAboutMe) => setProfile(prev => ({ ...prev, aboutMe: newAboutMe }))}
      />
        
      
      {/* Development Tool for Testing - Remove in Production */}
      {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}
      </div>
  );
};

export default ProfileHeader;
