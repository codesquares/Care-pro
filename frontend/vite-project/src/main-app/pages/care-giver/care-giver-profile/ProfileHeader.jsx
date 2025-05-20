import React, { useEffect, useState } from "react";
import "./profile-header.css";
import profilecard1 from '../../../../assets/profilecard1.png';
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
    status: false,
    verificationStatus: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        console.log(userDetails);
        if (!userDetails || !userDetails.id) {
          throw new Error("No caregiver ID found in local storage.");
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();

        // Fetch verification status from the node API
        let verificationStatusValue = "unverified";
        try {
          // First check localStorage for a previously saved verification status
          const localStatus = localStorage.getItem('verificationStatus');
          if (localStatus) {
            try {
              const parsed = JSON.parse(localStatus);
              if (parsed && parsed.verified) {
                verificationStatusValue = "verified";
                console.log("Using cached verification status from localStorage:", parsed);
              }
            } catch (err) {
              console.error("Error parsing localStorage verification status:", err);
            }
          }
          
          // If not verified in localStorage, check with the API
          if (verificationStatusValue !== "verified") {
            const verificationResponse = await verificationService.getVerificationStatus();
            if (verificationResponse && verificationResponse.data) {
              // Use the verification status from the node API
              verificationStatusValue = verificationResponse.data.verificationStatus || "unverified";
              console.log("Verification status from API:", verificationStatusValue);
            }
          }
        } catch (verificationError) {
          console.error("Error fetching verification status:", verificationError);
          // Default to unverified on error
        }

        const timeCreated = new Date(data.createdAt);
        const formattedDate = `${timeCreated.getFullYear()}-${String(
          timeCreated.getMonth() + 1
        ).padStart(2, "0")}-${String(timeCreated.getDate()).padStart(2, "0")}`;

        setProfile({
          name: `${data.firstName} ${data.lastName}` || "N/A",
          username: data.email || "N/A",
          bio:
            data.introduction ||
            "“Interested in giving the best healthcare services to your taste?”",
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          location: data.location || "N/A",
          memberSince: formattedDate || "N/A",
          lastDelivery: data.lastDelivery || "N/A",
          picture: data.picture || profilecard1,
          introVideo: data.introVideo || "",
          aboutMe: data.aboutMe || "N/A",
          status: data.status || false,
          // Use verification status from node API
          verificationStatus: verificationStatusValue,
        });

        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <div className="profile-header">
        <img src={profile.picture} alt="Profile" className="profile-img" />
        <h2>{profile.name}</h2>
        <p>@{profile.username}</p>
        <p>{profile.bio}</p>
        <div className="rating">
          {"⭐".repeat(Math.round(profile.rating))} ({profile.rating}, {profile.reviews} Reviews)
        </div>
        <div className="details">
          <p>📍 {profile.location}</p>
          <p>📅 Member since: {profile.memberSince}</p>
          <p>📦 Last Delivery: {profile.lastDelivery}</p>
        </div>
        <button className={`availability-btn ${profile.status ? 'available' : 'unavailable'}`}>
          {profile.status ? "Available" : "Unavailable"}
        </button>
        <div className="button-container">
          <VerifyButton verificationStatus={profile.verificationStatus} />
          <AssessmentButton verificationStatus={profile.verificationStatus} />
        </div>
      </div>
      <IntroVideo profileIntrovideo={profile.introVideo} />
      <ProfileInformation profileDescription = {profile.aboutMe}/>
      
      {/* Development Tool for Testing - Remove in Production */}
      {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}
    </>
  );
};

export default ProfileHeader;
