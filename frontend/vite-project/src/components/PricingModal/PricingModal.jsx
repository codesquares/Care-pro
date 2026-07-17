import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryCard from "../category/CategoryCard";
import CategoryIllustration from "../category/CategoryIllustration";
import { categoryBrowseData } from "../../main-app/constants/categoryBrowseData";
import "./PricingModal.css";

const pricingCategorySlugs = [
  "adult-care",
  "post-surgery-care",
  "child-care",
  "pet-care",
  "home-care",
  "special-needs-care",
  "medical-support",
  "mobility-support",
  "therapy-wellness",
  "palliative",
];

const pricingCategories = pricingCategorySlugs
  .map((slug) => categoryBrowseData.find((category) => category.slug === slug))
  .filter(Boolean)
  .map((category) => ({
    ...category,
    minPriceNGN: category.basePrice,
    minPriceUSD: 7,
  }));

const PricingModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currency, setCurrency] = useState("NGN");

  if (!isOpen) return null;

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleGetStarted = () => {
    if (!selectedCategory) return;
    const returnTo = `/marketplace?category=${selectedCategory.slug}`;
    navigate(`/register?returnTo=${encodeURIComponent(returnTo)}`);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      setSelectedCategory(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedCategory(null);
  };

  return (
    <div className="pricing-modal-overlay" onClick={handleOverlayClick}>
      <div className="pricing-modal">
        {/* Header */}
        <div className="pricing-modal__header">
          <div>
            <h2 className="pricing-modal__title">Service Pricing</h2>
            <p className="pricing-modal__subtitle">
              Select a category to view pricing and get started
            </p>
          </div>
          <button className="pricing-modal__close" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Currency Toggle */}
        <div className="pricing-modal__currency-toggle">
          <button
            className={`currency-btn ${currency === "NGN" ? "active" : ""}`}
            onClick={() => setCurrency("NGN")}
          >
            ₦ NGN
          </button>
          <button
            className={`currency-btn ${currency === "USD" ? "active" : ""}`}
            onClick={() => setCurrency("USD")}
          >
            $ USD
          </button>
        </div>

        {/* Categories Grid */}
        <div className="pricing-modal__grid">
          {pricingCategories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              category={cat}
              showDescription={false}
              showPrice={true}
              className={`pricing-category-card ${selectedCategory?.slug === cat.slug ? "selected" : ""}`}
              onClick={() => handleCategoryClick(cat)}
              priceContent={
                <>
                  {currency === "NGN" ? (
                    <>
                      From <strong>₦{cat.minPriceNGN.toLocaleString()}</strong>
                    </>
                  ) : (
                    <>
                      From <strong>${cat.minPriceUSD}</strong>
                    </>
                  )}
                  <span className="pricing-category-card__per-day"> / visit</span>
                </>
              }
            />
          ))}
        </div>

        {/* Selected Category Detail */}
        {selectedCategory && (
          <div className="pricing-modal__detail">
            <div className="pricing-modal__detail-icon" aria-hidden="true">
              <CategoryIllustration slug={selectedCategory.slug} />
            </div>
            <div className="pricing-modal__detail-info">
              <h3>{selectedCategory.name}</h3>
              <p>
                Starting at{" "}
                <strong>
                  {currency === "NGN"
                    ? `₦${selectedCategory.minPriceNGN.toLocaleString()}`
                    : `$${selectedCategory.minPriceUSD}`}
                  /visit
                </strong>
              </p>
              <span className="pricing-modal__detail-note">
                Prices may vary as more caregivers join the platform
              </span>
            </div>
            <button className="pricing-modal__cta" onClick={handleGetStarted}>
              Get Started
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="pricing-modal__footer">
          <p>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", marginRight: 6 }}>
              <circle cx="8" cy="8" r="7" stroke="#6b7280" strokeWidth="1.5" />
              <path d="M8 5v3M8 10.5h.01" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            All prices shown are minimum starting rates per visit. Actual pricing depends on the caregiver&apos;s experience, qualifications, and service scope.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
