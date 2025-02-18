import React, { useEffect, useState } from "react";
import "./profile-header.css";

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
    picture: "profile-pic.jpg",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Retrieve userDetails from local storage and parse it
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        console.log(userDetails.id);
        if (!userDetails || !userDetails.id) {
          throw new Error("No caregiver ID found in local storage.");
        }

        // Use the id from userDetails
        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`
        );
        

        if (!response.ok) {
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        console.log(data);

        // Map API response to the state
        setProfile({
          name: `${data.firstName} ${data.lastName}` || "N/A", // Use firstName and lastName if available, otherwise use "N/A"data.firstName || "N/A",
          username: data.email || "N/A",
          bio: data.introduction || "“Interested in giving the best healthcare services to your taste?”",
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          location: data.location || "N/A",
          memberSince: data.createdAt || "N/A",
          lastDelivery: data.lastDelivery || "N/A",
          picture: data.picture || "profile-pic.jpg",
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
      <button className="availability-btn">Available</button>
    </div>
  );
};

export default ProfileHeader;
