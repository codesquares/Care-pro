import { useNavigate } from "react-router-dom";
import "./clientDashboardHero.css";
import CareNeedsSummaryCard from "./CareNeedsSummaryCard";
import { marketplaceLinkForCategorySlug } from "../../../constants/categoryBrowseData";

// Category navigation items
const categories = [
  { name: "Home Care", slug: "home-care" },
  { name: "Adult & Elderly Care", slug: "adult-care" },
  { name: "Child Care", slug: "child-care" },
  { name: "Pet Care", slug: "pet-care" },
  { name: "Post Surgery Care", slug: "post-surgery-care" },
  { name: "Special Needs Care", slug: "special-needs-care" },
  { name: "Mobility Support", slug: "mobility-support" },
  { name: "Home Medical Support", slug: "medical-support" },
];

const ClientDashboardHero = ({
  userName, // TODO: Backend persistence not implemented yet - keeping prop for now
  profileCompletion = 10,
  remindersCount = 3,
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    navigate(marketplaceLinkForCategorySlug(slug));
  };

  const handleSetupProfile = () => {
    navigate("/app/client/profile");
  };

  const handleResolveIssues = () => {
    navigate("/app/client/notifications");
  };

  const handleWallet = () => {
    navigate("/app/client/wallet");
  };

  const handleBrowsePackages = () => {
    navigate("/marketplace");
  };

  return (
    <div className="client-dashboard-hero">
      {/* Categories Navigation */}
      <div className="categories-nav">
        <div className="categories-scroll">
          {categories.map((category) => (
            <button
              key={category.slug}
              className="category-nav-item"
              onClick={() => handleCategoryClick(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome{userName ? `, ${userName}` : ''}</h1> {/* TODO: Backend persistence not implemented yet */}
          <p className="welcome-subtitle">Let's get you all set up</p>
        </div>
        <div className="banner-cards">
          <div className="profile-completion-card" onClick={handleWallet}>
            <div className="profile-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div className="profile-info">
              <span className="profile-label">WALLET</span>
              <span className="profile-percentage">Check your balance</span>
              <span className="profile-cta">Click here to view your wallet.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="action-cards">
        {/* Reminders Card */}
        <div className="action-card reminders-card" onClick={handleResolveIssues}>
          <div className="card-icon reminders-icon">
            <span className="reminder-count">{remindersCount}</span>
          </div>
          <div className="card-content">
            <span className="card-label">REMINDERS</span>
            <span className="card-title">Click here to resolve pending issues,</span>
            <span className="card-subtitle">Complete it to get tailored suggestions.</span>
          </div>
        </div>

        {/* Setup Profile Card */}
        <div className="action-card profile-card" onClick={handleSetupProfile}>
          <div className="card-icon profile-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="card-content">
            <span className="card-label card-label-gray">SET UP YOUR PROFILE</span>
            <span className="card-title">You've added {profileCompletion}% of your profile</span>
            <span className="card-subtitle">Complete it to get tailored suggestions.</span>
          </div>
        </div>

        {/* Browse Packages Card */}
        <div className="action-card brief-card" onClick={handleBrowsePackages}>
          <div className="card-icon brief-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <div className="card-content">
            <span className="card-label card-label-gray">PRE-PRICED CARE PACKAGES</span>
            <span className="card-title">Browse care packages</span>
            <span className="card-subtitle">Pick a package and CarePro assigns your caregiver.</span>
          </div>
        </div>
      </div>

      {/* Care Needs Summary Card */}
      <CareNeedsSummaryCard />
    </div>
  );
};

export default ClientDashboardHero;
