import { useNavigate } from "react-router-dom";
import "./marketplaceHero.css";

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

const MarketplaceHero = ({ 
  filters = { serviceType: '', priceRange: { min: '', max: '' }, location: '' },
  onFilterChange = () => {}
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    navigate(`/marketplace?category=${slug}`);
  };

  const handlePostRequest = () => {
    navigate("/app/client/post-project");
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
    <div className="marketplace-hero">
      {/* Categories Navigation */}
      <div className="marketplace-categories-nav">
        <div className="marketplace-categories-scroll">
          {categories.map((category) => (
            <button
              key={category.slug}
              className="marketplace-category-item"
              onClick={() => handleCategoryClick(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="marketplace-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/')}>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Marketplace</span>
      </div>

      {/* Hero Banner */}
      <div className="marketplace-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">Browse Verified Caregivers</h1>
          <p className="marketplace-banner-subtitle">
            You can either use the search feature or post job request, explore these methods to navigate the platform efficiently & find your perfect match.
          </p>
        </div>
        <button className="marketplace-post-btn" onClick={handlePostRequest}>
          Post your Request &gt;
        </button>
      </div>

      {/* Filter Dropdowns */}
      <div className="marketplace-filters">
        <select 
          className="marketplace-filter-select"
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
          className="marketplace-filter-select"
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
          className="marketplace-filter-select"
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
  );
};

export default MarketplaceHero;
