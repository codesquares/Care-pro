import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./clientProfileCard.css";
import defaultAvatar from '../../../../assets/profilecard1.png';

const ClientProfileCard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const clientId = userDetails?.id;
  const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/Clients/${clientId}`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!clientId) {
          throw new Error("Client ID not found");
        }
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [API_URL, clientId]);

  if (loading) return <div className="profile-card loading"><p>Loading profile...</p></div>;
  if (error) return <div className="profile-card error"><p>Error: {error}</p></div>;

  const userFullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}` : '';
  const username = profile?.username || (profile?.email ? profile.email.split('@')[0] : '');
  
  return (
    <div className="profile-card">
      <img
        src={profile?.profilePicture || defaultAvatar}
        alt="Profile"
        className="profile-picture"
      />
      <div className="profile-details">
        <h3 className="profile-name">{userFullName.trim() || 'Welcome!'}</h3>
        <p className="profile-username">@{username || 'guest'}</p>
      </div>
      
      <div className="profile-navigation">
        <Link to="/app/client/profile" className="profile-nav-item">
          <i className="fas fa-user"></i> Profile
        </Link>
        <Link to="/app/client/verifications" className="profile-nav-item">
          <i className="fas fa-check-circle"></i> Verifications
        </Link>
        <Link to="/app/client/settings" className="profile-nav-item">
          <i className="fas fa-cog"></i> Settings
        </Link>
        <Link to="/app/client/my-order" className="profile-nav-item">
          <i className="fas fa-clipboard-list"></i> My Orders
        </Link>
      </div>
      
      <button
        className="view-profile-btn"
        onClick={() => navigate(`/app/client/profile`)}
      >
        View Full Profile
      </button>
    </div>
  );
};

export default ClientProfileCard;
