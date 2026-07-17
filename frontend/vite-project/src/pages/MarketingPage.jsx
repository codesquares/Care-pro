import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./MarketingPage.css";
import PricingModal from "../components/PricingModal/PricingModal";
import ClientGigService from "../main-app/services/clientGigService";
import ServiceCard from "../main-app/pages/client/client-dashboard/ServiceCard";
import CategoryCard from "../components/category/CategoryCard";
import { categoryBrowseData } from "../main-app/constants/categoryBrowseData";
import "../main-app/pages/client/client-dashboard/serviceCard.css";

// Import assets
import careproLogo from "../assets/careproLogo.svg";
import nurseImg from "../assets/nurse.png";
import nurseAndWomanImg from "../assets/nurseAndWoman.png";
import caregiver1 from "../assets/caregiver1.png";
import QHCC1 from "../assets/QHCC1.jpg";
import avatarFemale1 from "../assets/avatar-female-1.jpg";
import heroBackgroundVideo from "../assets/hero/marketing-hero-bg.mp4";
import heroVideoPoster from "../assets/hero/marketing-hero-poster.jpg";

// Healthcare facts
const healthcareFacts = [
  {
    text: "Post-surgical care significantly reduces readmission rates for patients with chronic conditions.",
    color: "#FDE7E7",
  },
  {
    text: "Quality sleep (7-9 hours) lowers the risk of illness, emphasising a serene environment.",
    color: "#D3E9FF",
  },
  {
    text: "Chronic stress increases cortisol, leading to weight gain and unhealthy cravings.",
    color: "#E6E3FF",
  },
  {
    text: "Mentally stimulating activities can reduce risk of dementia in older adults.",
    color: "#FDE7E7",
  },
];

const HERO_BACKGROUND_VIDEO_URL = heroBackgroundVideo;
const HERO_BACKGROUND_POSTER = heroVideoPoster;

const MarketingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHeroBackgroundLoaded, setIsHeroBackgroundLoaded] = useState(false);

  useEffect(() => {
    const fetchFeaturedGigs = async () => {
      try {
        const allGigs = await ClientGigService.getAllGigs();
        setFeaturedGigs(allGigs.slice(0, 4));
      } catch (err) {
        console.error("Error fetching featured gigs:", err);
      } finally {
        setGigsLoading(false);
      }
    };
    fetchFeaturedGigs();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    applyPreference();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyPreference);
      return () => mediaQuery.removeEventListener("change", applyPreference);
    }

    mediaQuery.addListener(applyPreference);
    return () => mediaQuery.removeListener(applyPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsHeroBackgroundLoaded(false);
    }
  }, [prefersReducedMotion]);

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

  const handleServiceClick = (categorySlug) => {
    navigate(`/marketplace?category=${categorySlug}`);
  };

  const handleBrowseAll = () => {
    navigate("/marketplace");
  };

  const handleBecomeCaregiver = () => {
    navigate("/become-caregiver");
  };

  const handleHireCaregiver = () => {
    navigate("/marketplace");
  };

  return (
    <div className="marketing-page">
      {/* Hero Section */}
      <section className="mk-hero">
        <div className="mk-hero__content">
          <div className="text-container mk-hero__headline" data-animate="headline">
            <span className="connect-text">Trusted profiles<span className="mk-hero__accent-period">.</span></span>
            <span className="profession-text">Trusted hires<span className="mk-hero__accent-period">.</span></span>
            <span className="demand-text">Trusted care<span className="mk-hero__accent-period">.</span></span>
          </div>

          {/* Search Bar */}
          <form className="mk-hero__search" data-animate="search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search services"
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

          {/* Popular Tags */}
          <div className="mk-hero__popular" data-animate="popular">
            <span>Popular:</span>
            <button onClick={() => handleServiceClick("adult-care")}>
              Adult Care
            </button>
            <button onClick={() => handleServiceClick("child-care")}>
              Nanny
            </button>
            <button onClick={() => handleServiceClick("home-care")}>
              Home Care
            </button>
            <button onClick={() => handleServiceClick("pet-care")}>
              Pet Care
            </button>
          </div>
        </div>

        <div className="mk-hero__visual">
          <div className="mk-hero__media">
            <img
              src={HERO_BACKGROUND_POSTER}
              alt=""
              aria-hidden="true"
              className={`mk-hero__media-poster ${isHeroBackgroundLoaded ? "is-hidden" : ""}`}
            />
            {!prefersReducedMotion && (
              <video
                className={`mk-hero__media-video ${isHeroBackgroundLoaded ? "is-visible" : ""}`}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={HERO_BACKGROUND_POSTER}
                onLoadedData={() => setIsHeroBackgroundLoaded(true)}
              >
                <source src={HERO_BACKGROUND_VIDEO_URL} type="video/mp4" />
              </video>
            )}
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
          <div className="services-cta-sec" onClick={handleHireCaregiver}>
            <div className="services-cta-sec-text">
              Trusted homecare at your fingertips.
            </div>
            <button className="services-cta-btn" type="button">
              Hire a caregiver <span aria-hidden="true">›</span>
            </button>
          </div>
          {/* <div className="browse-all-container">
            <button className="browse-all-btn" onClick={handleBrowseAll}>
              Browse All Services
            </button>
          </div> */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>How it works</h2>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-image">
                <img src={caregiver1} alt="Browse caregivers" />
              </div>
              <h3>Post job request or Browse service categories</h3>
              <p>
                There are several ways to discover the perfect caregiver or
                service on carepro. You can either use the search feature or
                post job request, explore these methods to navigate the
                platform efficiently and find your perfect match.
              </p>
              <div className="how-actions split">
                <button className="how-btn outline" onClick={() => navigate("/marketplace")}>Browse Services</button>
                <button className="how-btn fill" onClick={() => navigate("/app/client/post-project")}>Post job request</button>
              </div>
            </div>

            <div className="how-card">
              <div className="how-image">
                <img src={QHCC1} alt="Verified caregiver visit" />
              </div>
              <div className="how-profile">
                <img className="how-avatar" src={avatarFemale1} alt="Amina Yusuf" />
                <div className="how-profile-meta">
                  <div className="how-profile-top">
                    <div className="how-profile-name">Amina Yusuf</div>
                    <div className="how-profile-badge">Verified</div>
                  </div>
                  <div className="how-profile-location">Lagos, Nigeria</div>
                </div>
                <div className="how-profile-rating">
                  <span>★</span> 4.5
                </div>
              </div>
              <h3>Get to know your Care Professional</h3>
              <p>
                Explore verified caregiver profiles with key details like
                location, ratings and feedback, languages, and response times,
                explore the “about me” section will also to know more about
                caregivers, skills, experience, certifications.
              </p>
              <div className="how-actions">
                <button className="how-btn fill wide" onClick={handleBrowseAll}>
                  Explore Verified Caregivers
                </button>
              </div>
            </div>

            <div className="how-card">
              <div className="how-image">
                <img src={nurseAndWomanImg} alt="Care completed" />
              </div>
              <h3>Only pay when the job is done.</h3>
              <p>
                Upon confirming that the job is done, approve task or request
                completion of job, release payments after approving work,
                either by task or upon project completion.
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

      {/* CTA Banners Section */}
      {/* <section className="cta-banners-section">
        <div className="container">
          <div className="cta-banner hire-banner">
            <div className="cta-content">
              <h3>Hire a Caregiver today!</h3>
              <p>
                Find compassionate, qualified caregivers ready to support your
                loved ones with personalized care at home.
              </p>
              <button onClick={handleHireCaregiver}>Hire a Caregiver</button>
            </div>
            <div className="cta-image">
              <img src={nurseAndWomanImg} alt="Caregiver with patient" />
            </div>
          </div>

          <div className="cta-banner become-banner">
            <div className="cta-content">
              <h3>Become a Caregiver today!</h3>
              <p>
                As a CarePro caregiver, you have the opportunity to make an
                incredible difference helping clients live a happier life in
                their own home.
              </p>
              <button onClick={handleBecomeCaregiver}>Become a Caregiver</button>
            </div>
            <div className="cta-image">
              <img src={nurseImg} alt="Professional caregiver" />
            </div>
          </div>
        </div>
      </section> */}

      {/* Healthcare Facts Section */}
      {/* <section className="healthcare-facts-section">
        <div className="container">
          <div className="facts-header">
            <span className="facts-icon">🏥</span>
            <h2>Healthcare Facts</h2>
          </div>
          <div className="facts-grid">
            {healthcareFacts.map((fact, index) => (
              <div
                key={index}
                className="fact-card"
                style={{ backgroundColor: fact.color }}
              >
                <p>{fact.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Trust Section */}
      {/* <section className="trust-section">
        <div className="container">
          <h2>Why Choose CarePro?</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">✓</div>
              <h3>Verified Caregivers</h3>
              <p>
                All caregivers undergo thorough background checks and identity
                verification.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📋</div>
              <h3>Qualified Professionals</h3>
              <p>
                Our caregivers pass skill assessments and have valid
                certifications.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">⭐</div>
              <h3>Rated & Reviewed</h3>
              <p>
                Read honest reviews from families who have used our services.
              </p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>
                Safe and transparent payment system with money-back guarantee.
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Featured Caregivers Section */}
      <section className="featured-caregivers-section">
        <div className="container">
          <h2>Featured Caregivers</h2>
          {gigsLoading ? (
            <div className="featured-loading">Loading caregivers...</div>
          ) : featuredGigs.length > 0 ? (
            <div className="featured-grid">
              {featuredGigs.map((gig) => (
                <ServiceCard key={gig.id} {...gig} isPublic={true} />
              ))}
            </div>
          ) : (
            <div className="featured-empty">No caregivers available at the moment.</div>
          )}
          <div className="featured-browse">
            <button className="featured-browse-btn" onClick={handleBrowseAll}>
              Browse Caregivers <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mk-final-cta">
        <div className="container">
          <div className="mk-final-cta__card">
            <h2>Looking for the perfect care professional?</h2>
            <p>
              Over 300+ care professionals are waiting for you.
            </p>
            <button className="mk-final-cta__btn" onClick={handleHireCaregiver}>
              Hire a Caregiver
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingPage;
