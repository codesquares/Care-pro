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
          <div className="featured-caregiver-label-wrap">
            <span className="featured-caregiver-eyebrow">Featured Caregiver</span>
            <h3 className="featured-caregiver-title">Meet Your Caregiver</h3>
          </div>
          <img
            src={featuredServiceCard}
            alt="Featured caregiver services"
            className="featured-service-image"
          />
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
