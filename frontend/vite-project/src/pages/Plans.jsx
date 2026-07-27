import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import GeneralBanner from '../components/GeneralBanner';
import CategoryCard from '../components/category/CategoryCard';
import CategoryIllustration from '../components/category/CategoryIllustration';
import { categoryBrowseData } from '../main-app/constants/categoryBrowseData';
import '../components/PricingModal/PricingModal.css';
import '../styles/components/our-plans.css';

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

const Plans = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currency, setCurrency] = useState("NGN");

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleGetStarted = () => {
    if (!selectedCategory) return;
    const returnTo = `/marketplace?category=${selectedCategory.slug}`;
    navigate(`/register?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const platformFees = [
    {
      title: 'Client Service Charge',
      description: 'Orders over ₦100,000',
      fee: '10%',
      details: 'Checkout charge paid by the client for order processing and quality assurance'
    },
    {
      title: 'Caregiver/Platform Commission Split',
      description: 'Applied to cleared caregiver earnings',
      fee: '60% / 40%',
      details: 'Caregiver receives 60% and platform commission is 40%; this is separate from client checkout service charge'
    }
  ];

  return (
    <div className="our-plans">
      <Helmet>
        <title>Service Pricing - CarePro</title>
                <meta name="description" content="Explore CarePro's service pricing across care categories. Affordable rates starting from ₦10,000/visit for home care, child care, elderly care and more." />
        <meta name="keywords" content="care pricing, service rates, healthcare services, caregiver services, home care, eldercare, child care pricing" />
      </Helmet>

      <GeneralBanner 
        title="Service Pricing"
        subtitle="Select a category to view pricing and get started with the care you need."
        showButton={false}
      />

      <section className="plans-section">
        <div className="container">
          <div className="section-header">
            <h2>Service Pricing</h2>
            <p>Select a category to view pricing and get started</p>
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
      </section>

      <section className="fees-section">
        <div className="container">
          <div className="section-header">
            <h2>Platform Fees</h2>
            <p>Transparent pricing with no hidden costs. Client checkout charges and caregiver-platform commission are separate concepts.</p>
          </div>

          <div className="fees-grid">
            {platformFees.map((fee, index) => (
              <div key={index} className="fee-card">
                <div className="fee-header">
                  <h3>{fee.title}</h3>
                  <div className="fee-percentage">{fee.fee}</div>
                </div>
                <p className="fee-description">{fee.description}</p>
                <p className="fee-details">{fee.details}</p>
              </div>
            ))}
          </div>

          <div className="minimum-service-note">
            <div className="note-card">
              <h4>Minimum Service Fee</h4>
              <p>All individual services have a minimum fee of <strong>₦10,000</strong> to ensure quality care and fair compensation for our professional caregivers.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Plans;