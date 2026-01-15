import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./MarketingPage.css";

// Import assets
import careproLogo from "../assets/careproLogo.svg";
import nurseImg from "../assets/nurse.png";
import nurseAndWomanImg from "../assets/nurseAndWoman.png";

// Service categories for the grid - mapped to backend categories
const serviceCategories = [
  {
    id: 1,
    slug: "adult-care",
    name: "Adult Care",
    description: "Compassionate care for seniors and adults",
    icon: "👴",
    basePrice: 10000,
  },
  {
    id: 2,
    slug: "post-surgery-care",
    name: "Post Surgery Care",
    description: "Recovery support after surgery or hospital discharge",
    icon: "🏥",
    basePrice: 10000,
  },
  {
    id: 3,
    slug: "child-care",
    name: "Child Care",
    description: "Professional childcare and nanny services",
    icon: "👶",
    basePrice: 10000,
  },
  {
    id: 4,
    slug: "pet-care",
    name: "Pet Care",
    description: "Pet minding, dog walking, and pet companionship",
    icon: "🐕",
    basePrice: 10000,
  },
  {
    id: 5,
    slug: "home-care",
    name: "Home Care",
    description: "General home assistance and daily living support",
    icon: "🏠",
    basePrice: 10000,
  },
  {
    id: 6,
    slug: "special-needs-care",
    name: "Special Needs Care",
    description: "Specialized care for individuals with special needs",
    icon: "💙",
    basePrice: 10000,
  },
  {
    id: 7,
    slug: "medical-support",
    name: "Medical Support",
    description: "Nursing care and medical assistance",
    icon: "💊",
    basePrice: 10000,
  },
  {
    id: 8,
    slug: "mobility-support",
    name: "Mobility Support",
    description: "Mobility assistance and fall prevention",
    icon: "🦽",
    basePrice: 10000,
  },
  {
    id: 9,
    slug: "therapy-wellness",
    name: "Therapy & Wellness",
    description: "Physical therapy and wellness support",
    icon: "🧘",
    basePrice: 10000,
  },
  {
    id: 10,
    slug: "palliative",
    name: "Palliative",
    description: "Palliative care and emotional support",
    icon: "🤲",
    basePrice: 10000,
  },
];

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

const MarketingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
      <section className="hero-section">
        <div className="hero-content">
          <h1>
            Find the perfect <span className="highlight">care assistant</span>{" "}
            for your family
          </h1>
          <p className="hero-subtitle">
            Hire caregivers who have been vetted, evaluated and trained to fit
            your caregiving needs at home.
          </p>

          {/* Search Bar */}
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Try 'elderly care' or 'nanny'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleQuickSearch}
            />
            <button type="submit">Search</button>
          </form>

          {/* Popular Tags */}
          <div className="hero-popular">
            <span>Popular:</span>
            <button onClick={() => handleServiceClick('adult-care')}>Adult Care</button>
            <button onClick={() => handleServiceClick('child-care')}>Child Care</button>
            <button onClick={() => handleServiceClick('home-care')}>Home Care</button>
            <button onClick={() => handleServiceClick('post-surgery-care')}>Post-Op</button>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="services-section">
        <div className="container">
          <h2>Popular Services</h2>
          <div className="services-grid">
            {serviceCategories.map((service) => (
              <div
                key={service.id}
                className="service-card"
                onClick={() => handleServiceClick(service.slug)}
              >
                <div className="service-icon">{service.icon}</div>
                <div className="service-body">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-price">
                    Starting at ₦{service.basePrice.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="browse-all-container">
            <button className="browse-all-btn" onClick={handleBrowseAll}>
              Browse All Services
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>How CarePro Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Browse Caregivers</h3>
              <p>
                Search through our marketplace of verified and qualified
                caregivers based on your specific needs.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Choose Your Match</h3>
              <p>
                Review profiles, ratings, and services offered. Select the
                caregiver that best fits your requirements.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Book & Relax</h3>
              <p>
                Schedule your care service with confidence. Our caregivers are
                background-checked and insured.
              </p>
            </div>
          </div>
        </div>
      </section>

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
      <section className="trust-section">
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
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="container">
          <h2>Ready to find the perfect caregiver?</h2>
          <p>Join thousands of families who trust CarePro for quality care.</p>
          <div className="final-cta-buttons">
            <button className="primary-btn" onClick={handleHireCaregiver}>
              Find a Caregiver
            </button>
            <button className="secondary-btn" onClick={handleBecomeCaregiver}>
              Become a Caregiver
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketingPage;
