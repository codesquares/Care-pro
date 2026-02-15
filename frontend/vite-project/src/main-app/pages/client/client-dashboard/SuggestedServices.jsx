import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./suggestedServices.css";
import featuredServiceCard from "../../../../assets/CTA.png";

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
        {/* Featured Service Card Image */}
        <div className="featured-caregiver-card">
          <img 
            src={featuredServiceCard} 
            alt="Featured caregiver services" 
            className="featured-service-image"
            onClick={() => navigate('/marketplace')}
          />
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

      {/* <div className="browse-categories-container">
        <button className="browse-categories-btn" onClick={handleBrowseCategories}>
          Browse service categories
        </button>
      </div> */}
    </div>
  );
};

export default SuggestedServices;
