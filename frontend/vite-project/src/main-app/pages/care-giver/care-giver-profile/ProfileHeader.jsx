import React, { useEffect, useState } from "react";
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

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const caregiverId = userDetails?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!caregiverId) {
        setError("No caregiver ID found.");
        setIsLoading(false);
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

        // Default verification
        let verificationStatusValue = "verified";

        try {
          const cached = localStorage.getItem("verificationStatus");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.verified) {
              verificationStatusValue = "verified";
            }
          }

          if (verificationStatusValue !== "verified") {
            const verificationResponse = await verificationService.getVerificationStatus();
            if (verificationResponse?.data?.verificationStatus) {
              verificationStatusValue = verificationResponse.data.verificationStatus;
            }
          }
        } catch (verificationError) {
          console.warn("Verification check failed:", verificationError);
        }

        const createdAt = new Date(data.createdAt);
        const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")}`;

        setProfile({
          name: `${data.firstName} ${data.lastName}`,
          username: data.email,
          bio: data.introduction || "“Interested in giving the best healthcare services to your taste?”",
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
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [caregiverId]); // Only run once per ID

  if (isLoading) return <p>Loading...</p>;
  if (error || !profile) return <p>Error: {error}</p>;

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
      <ProfileInformation profileDescription={profile.aboutMe} />

      {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}
    </>
  );
};

export default ProfileHeader;
