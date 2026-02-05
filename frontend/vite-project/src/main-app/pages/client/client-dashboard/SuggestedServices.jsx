import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./suggestedServices.css";
import caregiverBg from "../../../../assets/suggested_care_image.png";
import defaultAvatar from "../../../../assets/profilecard1.png";

// Featured service categories to display (6 cards)
// Each category has: id, slug, name, description, icon, basePrice
const featuredCategories = [
  {
    id: 1,
    slug: "adult-care",
    name: "Adult & Elderly Care",
    description: "Dignified independence-focused assistance to keep seniors active, comfortable, & cared for.",
    icon: "👴",
    basePrice: 10000,
  },
  {
    id: 2,
    slug: "pet-care",
    name: "Pet Care",
    description: "Reliable feeding, walking, & companionship for your pets — even when you're away.",
    icon: "🐕",
    basePrice: 10000,
  },
  {
    id: 3,
    slug: "medical-support",
    name: "Home Medical Support",
    description: "Ongoing clinical care at home, skilled nursing, vitals monitoring, chronic illness support.",
    icon: "💊",
    basePrice: 10000,
  },
  {
    id: 4,
    slug: "home-care",
    name: "Home Care",
    description: "Comprehensive everyday support: meals, mobility, companionship, & light home help.",
    icon: "🏠",
    basePrice: 10000,
  },
  {
    id: 5,
    slug: "mobility-support",
    name: "Mobility Support",
    description: "Mobility assistance and fall prevention.",
    icon: "🦽",
    basePrice: 10000,
  },
  {
    id: 6,
    slug: "special-needs-care",
    name: "Special Needs Care",
    description: "Specialized care for individuals with special needs.",
    icon: "💙",
    basePrice: 10000,
  },
];

const SuggestedServices = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleCategoryClick = (categorySlug) => {
    navigate(`/marketplace?category=${categorySlug}`);
  };

  const handleManageOrders = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      navigate('/app/client/orders');
    } else {
      navigate('/register');
    }
  };

  const handleConnectCaregivers = () => {
    navigate('/marketplace');
  };

  const handleBrowseCategories = () => {
    navigate('/marketplace');
  };

  return (
    <div className="suggested-services-section">
      <div className="suggested-services-header">
        <h2>Suggested services</h2>
      </div>

      <div className="suggested-services-layout">
        {/* Left: Featured Caregiver Card */}
        <div 
          className="featured-caregiver-card"
          style={{ backgroundImage: `url(${caregiverBg})` }}
        >
          {/* Top section */}
          <div className="featured-top-section">
            <button className="manage-orders-btn" onClick={handleManageOrders}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 11H15M9 15H15M21 8.5V17.5C21 20 19.5 22 16.5 22H7.5C4.5 22 3 20 3 17.5V8.5C3 6 4.5 4 7.5 4H9.5C10 4 10.33 4.19 10.5 4.5L11.5 6C11.67 6.31 12 6.5 12.5 6.5H16.5C19.5 6.5 21 8 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Manage active Orders
            </button>
          </div>

          {/* Middle section - Browse text */}
          <div className="featured-middle-section">
            <span className="browse-categories-text">Browse service categories</span>
          </div>

          {/* Bottom section - Category preview card + Profile */}
          <div className="featured-bottom-section">
            {/* Category Preview Card */}
            <div className="category-preview-card" onClick={() => handleCategoryClick('adult-care')}>
              <div className="preview-icon">👴</div>
              <div className="preview-content">
                <h4>Adult & Elderly Care</h4>
                <p>Dignified, independence-focused assistance to keep seniors active, comfortable, and cared for.</p>
                <span className="preview-price">Starting at ₦10,000</span>
              </div>
            </div>

            {/* Connect Button */}
            <button className="connect-caregivers-btn" onClick={handleConnectCaregivers}>
              Connect with qualified Caregivers
            </button>

            {/* Profile Card */}
            <div className="featured-caregiver-profile">
              <div className="profile-avatar">
                <img src={user?.profileImage || defaultAvatar} alt="Caregiver" />
              </div>
              <div className="profile-info">
                <div className="profile-name-row">
                  <span className="profile-name">
                    {isAuthenticated ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Beatrice Andrew' : 'Beatrice Andrew'}
                  </span>
                  <span className="verified-badge-text">
                    <span className="verified-text">Verified</span>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M17.9658 8.95046L16.8324 7.63379C16.6158 7.38379 16.4408 6.91712 16.4408 6.58379V5.16712C16.4408 4.28379 15.7158 3.55879 14.8324 3.55879H13.4158C13.0908 3.55879 12.6158 3.38379 12.3658 3.16712L11.0491 2.03379C10.4741 1.54212 9.53242 1.54212 8.94909 2.03379L7.64076 3.17546C7.39076 3.38379 6.91576 3.55879 6.59075 3.55879H5.14909C4.26576 3.55879 3.54076 4.28379 3.54076 5.16712V6.59212C3.54076 6.91712 3.36576 7.38379 3.15742 7.63379L2.03242 8.95879C1.54909 9.53379 1.54909 10.4671 2.03242 11.0421L3.15742 12.3671C3.36576 12.6171 3.54076 13.0838 3.54076 13.4088V14.8338C3.54076 15.7171 4.26576 16.4421 5.14909 16.4421H6.59075C6.91576 16.4421 7.39076 16.6171 7.64076 16.8338L8.95742 17.9671C9.53242 18.4588 10.4741 18.4588 11.0574 17.9671L12.3741 16.8338C12.6241 16.6171 13.0908 16.4421 13.4241 16.4421H14.8408C15.7241 16.4421 16.4491 15.7171 16.4491 14.8338V13.4171C16.4491 13.0921 16.6241 12.6171 16.8408 12.3671L17.9741 11.0505C18.4574 10.4755 18.4574 9.52546 17.9658 8.95046ZM13.4658 8.42546L9.44076 12.4505C9.32409 12.5671 9.16576 12.6338 8.99909 12.6338C8.83242 12.6338 8.67409 12.5671 8.55742 12.4505L6.54076 10.4338C6.29909 10.1921 6.29909 9.79212 6.54076 9.55046C6.78242 9.30879 7.18242 9.30879 7.42409 9.55046L8.99909 11.1255L12.5824 7.54212C12.8241 7.30046 13.2241 7.30046 13.4658 7.54212C13.7074 7.78379 13.7074 8.18379 13.4658 8.42546Z" fill="#135DFF"/>
                    </svg>
                  </span>
                </div>
                <div className="profile-location-rating">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#10b981">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="location-text">Ikeja, Lagos, Nigeria</span>
                  <div className="profile-rating">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc107">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>4.5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Categories Grid */}
        <div className="suggested-categories-grid">
          {featuredCategories.map((category) => (
            <div
              key={category.id}
              className="suggested-category-card"
              onClick={() => handleCategoryClick(category.slug)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-body">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <div className="category-price">
                  Starting at ₦{category.basePrice.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="browse-categories-container">
        <button className="browse-categories-btn" onClick={handleBrowseCategories}>
          Browse service categories
        </button>
      </div>
    </div>
  );
};

export default SuggestedServices;
