import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./MarketingPage.css";
import PricingModal from "../components/PricingModal/PricingModal";
import CategoryCard from "../components/category/CategoryCard";
import { categoryBrowseData, REAL_PACKAGE_CATEGORY_BY_SLUG } from "../main-app/constants/categoryBrowseData";

// Import assets
import nurseAndWomanImg from "../assets/nurseAndWoman.png";
import nurse from "../assets/nurse.png";
import caregiver1 from "../assets/caregiver1.png";
import QHCC1 from "../assets/QHCC1.jpg";

const POPULAR_PACKAGE_CATEGORIES = [
  { label: "Adult & Elder Care", value: "Adult/Elder Care" },
  { label: "Post-Partum Care", value: "Post-Partum Care" },
  { label: "Post Surgery Care", value: "Post Surgery Care" },
  { label: "Live-in Care", value: "Live-in Package" },
];

const MarketingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/marketplace");
    }
  };

  const handleQuickSearch = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  const handlePackageCategoryClick = (categoryValue) => {
    navigate(`/marketplace?category=${encodeURIComponent(categoryValue)}`);
  };

  const handleServiceClick = (categorySlug) => {
    const realCategory = REAL_PACKAGE_CATEGORY_BY_SLUG[categorySlug];
    if (realCategory) {
      navigate(`/marketplace?category=${encodeURIComponent(realCategory)}`);
    } else {
      navigate("/marketplace");
    }
  };

  const handleBrowsePackages = () => {
    navigate("/marketplace");
  };

  const handleStartAssessment = () => {
    navigate(`/register?returnTo=${encodeURIComponent("/start-assessment")}`);
  };

  return (
    <div className="marketing-page">
      {/* Hero Section */}
      <section className="mk-hero">
        <div className="mk-hero__content">
          <div className="text-container mk-hero__headline" data-animate="headline">
            <span className="connect-text">Rigorously vetted<span className="mk-hero__accent-period">.</span></span>
            <span className="profession-text">Fully accountable<span className="mk-hero__accent-period">.</span></span>
            <span className="demand-text">That's CarePro care<span className="mk-hero__accent-period">.</span></span>
          </div>

          <p className="mk-hero__subline" data-animate="headline">
            You contract with CarePro, not a stranger. We vet every caregiver,
            assign the right one for your needs, and stand behind every visit.
          </p>

          {/* Search Bar */}
          <form className="mk-hero__search" data-animate="search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search care packages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleQuickSearch}
            />
            <button type="submit">
              <span className="mk-hero__search-icon" aria-hidden="true">
                &#128269;
              </span>
              Search
            </button>
          </form>

          {/* Real package categories */}
          <div className="mk-hero__popular-block" data-animate="popular">
            <div className="mk-hero__popular">
              <span>Popular:</span>
              {POPULAR_PACKAGE_CATEGORIES.map((cat) => (
                <button key={cat.value} onClick={() => handlePackageCategoryClick(cat.value)}>
                  {cat.label}
                </button>
              ))}
            </div>

            <p className="mk-hero__popular-tagline">
              Now serving families across Nigeria.
            </p>
          </div>

          {/* Assessment CTA */}
          <div className="mk-hero__assessment-cta" data-animate="assessment-cta">
            <p>Not sure where to start?</p>
            <button type="button" onClick={handleStartAssessment}>
              Get a Free Care Assessment <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>

        <div className="mk-hero__visual">
          <div className="mk-hero__media">
            <img
              src={nurseAndWomanImg}
              alt="A CarePro caregiver assisting a client at home"
              className="mk-hero__media-poster"
            />
            <div className="mk-hero__trust-badge">
              <span className="mk-hero__trust-badge-icon" aria-hidden="true">✓</span>
              <span>Every caregiver background-checked &amp; verified by CarePro</span>
            </div>
          </div>
        </div>

        <div className="mk-hero__divider" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false">
            <path d="M0,22 C220,76 420,6 700,34 C970,62 1180,6 1440,28 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="services-section">
        <div className="container">
          <h2>Popular Services</h2>
          <div className="services-row" aria-label="Popular service categories">
            {categoryBrowseData.map((service) => (
              <CategoryCard
                key={service.id}
                category={service}
                showDescription={false}
                showPrice={false}
                onClick={() => handleServiceClick(service.slug)}
              />
            ))}
          </div>
          <div className="services-cta-sec" onClick={handleBrowsePackages}>
            <div className="services-cta-sec-text">
              Trusted homecare at your fingertips.
            </div>
            <button className="services-cta-btn" type="button">
              Browse Care Packages <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>How it works</h2>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-image">
                <img src={caregiver1} alt="Browsing care packages" />
              </div>
              <h3>Browse packages, or tell us what you need</h3>
              <p>
                Choose from clear, pre-priced care packages, or start a free
                assessment and describe your situation — either way, you're
                not picking a specific caregiver yourself.
              </p>
              <div className="how-actions split">
                <button className="how-btn fill" onClick={handleBrowsePackages}>Browse Packages</button>
              </div>
            </div>

            <div className="how-card">
              <div className="how-image">
                <img src={QHCC1} alt="A vetted caregiver providing care" />
              </div>
              <h3>We match and assign your caregiver</h3>
              <p>
                CarePro's team vets every caregiver and internally assigns the
                right match for your needs. You're introduced to your confirmed
                caregiver only after they've accepted — no browsing, no
                negotiating with strangers.
              </p>
              <div className="how-actions">
                <button className="how-btn fill wide" onClick={handleStartAssessment}>
                  Get a Free Care Assessment
                </button>
              </div>
            </div>

            <div className="how-card">
              <div className="how-image">
                <img src={nurse} alt="Care backed by a CarePro agreement" />
              </div>
              <h3>Backed by a CarePro contract</h3>
              <p>
                Every engagement is covered by a standard CarePro service
                agreement — clear terms, no back-and-forth negotiation, and
                CarePro stands behind the work from day one.
              </p>
              <div className="how-actions">
                <button className="how-btn fill wide" onClick={() => setIsPricingModalOpen(true)}>View Pricing</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Modal */}
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <h2>Why Choose CarePro?</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🛡️</div>
              <h3>Rigorously Vetted</h3>
              <p>
                Every caregiver goes through background checks, identity
                verification, and guarantor checks before they ever get assigned.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📄</div>
              <h3>You Contract With CarePro</h3>
              <p>
                You're covered by a CarePro service agreement, not an informal
                arrangement with an individual — clear terms, no negotiation needed.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🎯</div>
              <h3>Matched, Not Browsed</h3>
              <p>
                We internally assign the right caregiver for your specific
                needs, so you don't have to vet profiles or guess who's a good fit.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🤝</div>
              <h3>Accountable Care</h3>
              <p>
                CarePro stands behind every placement, start to finish — that's
                the whole point of contracting with us instead of a stranger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mk-final-cta">
        <div className="container">
          <div className="mk-final-cta__card">
            <h2>Ready to get started?</h2>
            <p>
              Browse pre-priced care packages, or let us guide you with a free assessment.
            </p>
            <div className="mk-final-cta__actions">
              <button className="mk-final-cta__btn" onClick={handleBrowsePackages}>
                Browse Care Packages
              </button>
              <button className="mk-final-cta__btn mk-final-cta__btn--secondary" onClick={handleStartAssessment}>
                Get a Free Care Assessment
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingPage;
