import { useNavigate } from "react-router-dom";
import "./clientDashboardHero.css";
import CareNeedsSummaryCard from "./CareNeedsSummaryCard";

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
  filters = { serviceType: '', priceRange: { min: '', max: '' }, location: '' },
  onFilterChange = () => {}
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    navigate(`/marketplace?category=${slug}`);
  };

  const handleSetupProfile = () => {
    navigate("/app/client/profile");
  };

  const handleResolveIssues = () => {
    navigate("/app/client/notifications");
  };

  const handlePostBrief = () => {
    navigate("/app/client/post-project");
  };

  const handleSetCarePreferences = () => {
    navigate("/app/client/care-needs?returnTo=/app/client/dashboard");
  };

  // Filter handlers
  const handleServiceTypeChange = (e) => {
    onFilterChange({ ...filters, serviceType: e.target.value });
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    const [min, max] = value.split('-');
    onFilterChange({ 
      ...filters, 
      priceRange: { min: min || '', max: max || '' } 
    });
  };

  const handleLocationChange = (e) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  // Get current budget value for select
  const getBudgetValue = () => {
    if (!filters.priceRange?.min && !filters.priceRange?.max) return '';
    return `${filters.priceRange.min || ''}-${filters.priceRange.max || ''}`;
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
        <div className="profile-completion-card" onClick={handleSetupProfile}>
          <div className="profile-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="profile-info">
            <span className="profile-label">SET UP YOUR PROFILE</span>
            <span className="profile-percentage">You've added {profileCompletion}% of your profile</span>
            <span className="profile-cta">Complete it to get tailored suggestions.</span>
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

        {/* Post Project Brief Card */}
        <div className="action-card brief-card" onClick={handlePostBrief}>
          <div className="card-icon brief-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <div className="card-content">
            <span className="card-label card-label-gray">CAN'T FIND YOUR PREFERRED CAREGIVER?</span>
            <span className="card-title">Post a project brief</span>
            <span className="card-subtitle">Get tailored offers for your needs.</span>
          </div>
        </div>
      </div>

      {/* Care Needs Summary Card */}
      <CareNeedsSummaryCard />

      {/* Filter Bar */}
      <div className="dashboard-filter-bar">
        <div className="filter-label">Quick Filters:</div>
        <div className="preferences-filters">
          <select 
            className="filter-select"
            value={filters.serviceType || ''}
            onChange={handleServiceTypeChange}
          >
            <option value="">Service options</option>
            <option value="Adult Care">Adult Care</option>
            <option value="Post Surgery Care">Post Surgery Care</option>
            <option value="Child Care">Child Care</option>
            <option value="Pet Care">Pet Care</option>
            <option value="Home Care">Home Care</option>
            <option value="Special Needs Care">Special Needs Care</option>
            <option value="Elderly Care">Elderly Care</option>
            <option value="Rehabilitation">Rehabilitation</option>
          </select>

          <select 
            className="filter-select"
            value={getBudgetValue()}
            onChange={handleBudgetChange}
          >
            <option value="">Budget</option>
            <option value="0-5000">₦0 - ₦5,000</option>
            <option value="5000-10000">₦5,000 - ₦10,000</option>
            <option value="10000-20000">₦10,000 - ₦20,000</option>
            <option value="20000-">₦20,000+</option>
          </select>

          <select 
            className="filter-select"
            value={filters.location || ''}
            onChange={handleLocationChange}
          >
            <option value="">Location</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Port Harcourt">Port Harcourt</option>
            <option value="Ibadan">Ibadan</option>
            <option value="Kano">Kano</option>
            <option value="Enugu">Enugu</option>
            <option value="Kaduna">Kaduna</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardHero;
