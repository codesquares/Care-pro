import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PricingModal.css";

const pricingCategories = [
  { slug: "adult-care", name: "Adult Care", icon: "👴", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "post-surgery-care", name: "Post Surgery Care", icon: "🏥", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "child-care", name: "Child Care", icon: "👶", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "pet-care", name: "Pet Care", icon: "🐕", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "home-care", name: "Home Care", icon: "🏠", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "special-needs-care", name: "Special Needs Care", icon: "💙", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "medical-support", name: "Medical Support", icon: "💊", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "mobility-support", name: "Mobility Support", icon: "🦽", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "therapy-wellness", name: "Therapy & Wellness", icon: "🧘", minPriceNGN: 10000, minPriceUSD: 7 },
  { slug: "palliative", name: "Palliative", icon: "🤲", minPriceNGN: 10000, minPriceUSD: 7 },
];

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
            <div
              key={cat.slug}
              className={`pricing-category-card ${selectedCategory?.slug === cat.slug ? "selected" : ""}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="pricing-category-card__icon">{cat.icon}</div>
              <div className="pricing-category-card__info">
                <h4 className="pricing-category-card__name">{cat.name}</h4>
                <div className="pricing-category-card__price">
                  {currency === "NGN" ? (
                    <>
                      From <strong>₦{cat.minPriceNGN.toLocaleString()}</strong>
                    </>
                  ) : (
                    <>
                      From <strong>${cat.minPriceUSD}</strong>
                    </>
                  )}
                  <span className="pricing-category-card__per-day"> / day</span>
                </div>
              </div>
              <div className="pricing-category-card__check">
                {selectedCategory?.slug === cat.slug && (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="11" fill="#10b981" />
                    <path d="M6 11.5L9.5 15L16 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Category Detail */}
        {selectedCategory && (
          <div className="pricing-modal__detail">
            <div className="pricing-modal__detail-icon">{selectedCategory.icon}</div>
            <div className="pricing-modal__detail-info">
              <h3>{selectedCategory.name}</h3>
              <p>
                Starting at{" "}
                <strong>
                  {currency === "NGN"
                    ? `₦${selectedCategory.minPriceNGN.toLocaleString()}`
                    : `$${selectedCategory.minPriceUSD}`}
                  /day
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
            All prices shown are minimum starting rates per day. Actual pricing depends on the caregiver&apos;s experience, qualifications, and service scope.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
