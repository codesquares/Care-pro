import { useNavigate } from "react-router-dom";
import "./suggestedServices.css";
import CategoryCard from "../../../../components/category/CategoryCard";
import { categoryBrowseData } from "../../../constants/categoryBrowseData";
import featuredServiceCard from "../../../../assets/CTA.png";

const SuggestedServices = () => {
  const navigate = useNavigate();
  const featuredCategories = categoryBrowseData.slice(0, 6);

  const handleCategoryClick = (categorySlug) => {
    navigate(`/marketplace?category=${categorySlug}`);
  };

  return (
    <div className="suggested-services-section">
      <div className="suggested-services-header">
        <h2>Suggested services</h2>
      </div>

      <div className="suggested-services-layout">
        {/* Featured Service Card Image */}
        <div
          className="featured-caregiver-card"
          onClick={() => navigate('/marketplace')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate('/marketplace');
            }
          }}
          aria-label="Featured Caregiver spotlight"
        >
          <img
            src={featuredServiceCard}
            alt=""
            aria-hidden="true"
            className="featured-caregiver-photo"
          />
          <div className="featured-caregiver-label-wrap">
            <span className="featured-caregiver-eyebrow">Featured Caregiver</span>
            <h3 className="featured-caregiver-title">Meet Your Caregiver</h3>
          </div>
          <div className="featured-caregiver-content">
            <div className="featured-pill featured-pill--orders">
              <span className="featured-pill__icon" aria-hidden="true">🛍️</span>
              <span>Manage active Orders</span>
            </div>

            <div className="featured-pill featured-pill--browse">Browse service categories</div>

            <div className="featured-info-card">
              <div className="featured-info-card__emoji" aria-hidden="true">😊</div>
              <div className="featured-info-card__body">
                <strong>Adult &amp; Elderly Care</strong>
                <p>Dignified, independence-focused assistance to keep seniors active, comfortable, and cared for.</p>
              </div>
            </div>

            <div className="featured-connect-banner">Connect with qualified Caregivers</div>

            <div className="featured-profile-card">
              <div className="featured-profile-card__row">
                <div className="featured-profile-card__avatar">FA</div>
                <div className="featured-profile-card__meta">
                  <strong>Funke Adeyemi</strong>
                  <span className="featured-profile-card__badge">Verified ✓</span>
                  <span className="featured-profile-card__rating">⭐ 4.5</span>
                </div>
              </div>
              <span className="featured-profile-card__location">📍 Ikoyi, Lagos, Nigeria</span>
            </div>
          </div>
        </div>

        {/* Right: Categories Grid */}
        <div className="suggested-categories-grid">
          {featuredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              showDescription={true}
              showPrice={true}
              className="suggested-category-card"
              onClick={() => handleCategoryClick(category.slug)}
            />
          ))}
        </div>
      </div>

      {/* <div className="browse-categories-container">
        <button className="browse-categories-btn" onClick={() => navigate('/marketplace')}>
          Browse service categories
        </button>
      </div> */}
    </div>
  );
};

export default SuggestedServices;
