import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import "./matchedServices.css";
import MarketplaceHero from "./MarketplaceHero";
import ServiceCategory from "./ServiceCategory";
import SuggestedServices from "./SuggestedServices";
import FilterBarDropdown from "../components/FilterBar";
import ClientGigService from "../../../services/clientGigService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";
import MatchingService from "../../../services/matchingService";
import QualityHealthCareCards from "../../../../components/QualityHealthCareCards";
import TopBanner from "../../../../components/TopBanner";
import genralImg from "../../../../assets/nurse.png";
import CareFacts from "../../../../pages/CareFacts";

// Category slug to backend category name mapping
const categorySlugMap = {
  'adult-care': 'Adult Care',
  'post-surgery-care': 'Post Surgery Care',
  'child-care': 'Child Care',
  'pet-care': 'Pet Care',
  'home-care': 'Home Care',
  'special-needs-care': 'Special Needs Care',
  'medical-support': 'Medical Support',
  'mobility-support': 'Mobility Support',
  'therapy-wellness': 'Therapy & Wellness',
  'palliative': 'Palliative'
};

const PublicMarketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [popularGigs, setPopularGigs] = useState([]);
  const [topRatedGigs, setTopRatedGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActivelySearching, setIsActivelySearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMatchedMode, setIsMatchedMode] = useState(false);
  const [matchedServices, setMatchedServices] = useState([]);
  const [clientCareNeeds, setClientCareNeeds] = useState(null);

  const [filters, setFilters] = useState({
    sortBy: '',
    priceRange: { min: '', max: '' },
    serviceType: '',
    location: '',
    minRating: '',
    quickFilter: '',
    searchTerm: ''
  });

  const [careNeedsSet, setCareNeedsSet] = useState(false);

  /**
   * Calculate match scores between gigs and client care needs
   * @param {Array} gigs - Available gigs
   * @param {Object} careNeeds - Client's care needs
   * @returns {Array} Gigs with match scores, sorted by score
   */
  const calculateMatchScores = (gigs, careNeeds) => {
    if (!gigs || !careNeeds) return [];
    
    return gigs.map(gig => {
      let score = 0;
      let maxScore = 0;
      const matchReasons = [];
      
      // 1. Service category match (30 points)
      maxScore += 30;
      if (careNeeds.serviceCategories && careNeeds.serviceCategories.length > 0) {
        const gigCategory = (gig.category || '').toLowerCase();
        const matchedCategory = careNeeds.serviceCategories.find(cat => 
          gigCategory.includes(cat.toLowerCase()) || cat.toLowerCase().includes(gigCategory)
        );
        if (matchedCategory) {
          score += 30;
          matchReasons.push(`${matchedCategory} specialist`);
        }
      }
      
      // 2. Certification match (20 points)
      maxScore += 20;
      if (careNeeds.caregiverRequirements?.certifications && careNeeds.caregiverRequirements.certifications.length > 0) {
        const gigCerts = gig.caregiverCertifications || [];
        const matchedCerts = careNeeds.caregiverRequirements.certifications.filter(cert =>
          gigCerts.some(gc => gc.toLowerCase().includes(cert.toLowerCase()) || cert.toLowerCase().includes(gc.toLowerCase()))
        );
        if (matchedCerts.length > 0) {
          score += Math.min(20, (matchedCerts.length / careNeeds.caregiverRequirements.certifications.length) * 20);
          matchReasons.push(`${matchedCerts.length} cert${matchedCerts.length > 1 ? 's' : ''} matched`);
        }
      }
      
      // 3. Language match (15 points)
      maxScore += 15;
      if (careNeeds.caregiverRequirements?.languages && careNeeds.caregiverRequirements.languages.length > 0) {
        const gigLangs = gig.caregiverLanguages || [];
        const matchedLangs = careNeeds.caregiverRequirements.languages.filter(lang =>
          gigLangs.some(gl => gl.toLowerCase().includes(lang.toLowerCase()))
        );
        if (matchedLangs.length > 0) {
          score += 15;
          matchReasons.push(`Speaks ${matchedLangs[0]}`);
        }
      }
      
      // 4. Experience level match (15 points)
      maxScore += 15;
      if (careNeeds.caregiverRequirements?.experienceLevel) {
        const expMap = {
          'Entry Level': 0,
          'Some Experience': 1,
          'Experienced': 3,
          'Very Experienced': 5,
          'Expert': 10
        };
        const requiredYears = expMap[careNeeds.caregiverRequirements.experienceLevel.split(' (')[0]] || 0;
        if ((gig.caregiverExperience || 0) >= requiredYears) {
          score += 15;
          matchReasons.push(`${gig.caregiverExperience}+ years exp`);
        }
      }
      
      // 5. Verified caregiver bonus (10 points)
      maxScore += 10;
      if (gig.caregiverIsVerified) {
        score += 10;
        matchReasons.push('Verified');
      }
      
      // 6. Rating bonus (10 points)
      maxScore += 10;
      if ((gig.caregiverRating || 0) >= 4) {
        score += 10;
        matchReasons.push(`★ ${gig.caregiverRating}`);
      }
      
      const matchPercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      
      return {
        ...gig,
        matchScore: matchPercentage,
        matchReasons: matchReasons.slice(0, 3) // Top 3 reasons
      };
    })
    .filter(gig => gig.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 matches
  };

  // Extract search query, category, and matched mode from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('q');
    const categorySlug = urlParams.get('category');
    const matchedParam = urlParams.get('matched');
    
    // Map category slug to backend category name
    const categoryName = categorySlug ? categorySlugMap[categorySlug] : null;
    setActiveCategory(categoryName);
    setIsMatchedMode(matchedParam === 'true');
    
    setFilters(prevFilters => ({
      ...prevFilters,
      searchTerm: searchQuery || '',
      serviceType: categoryName || ''
    }));
  }, [location.search]);

  // Listen for real-time search changes from navigation bar
  useEffect(() => {
    const handleSearchChange = (event) => {
      const { searchQuery, isSearching } = event.detail;
      setFilters(prevFilters => ({
        ...prevFilters,
        searchTerm: searchQuery || ''
      }));

      // Update active searching state
      if (isSearching !== undefined) {
        setIsActivelySearching(isSearching);
      }
    };

    window.addEventListener('searchChanged', handleSearchChange);

    return () => {
      window.removeEventListener('searchChanged', handleSearchChange);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const allGigs = await ClientGigService.getAllGigs();
        setServices(allGigs);
        setFilteredServices(ClientGigService.applyAdvancedFilters(allGigs, filters));

        const popular = await ClientGigService.getPopularGigs(6);
        setPopularGigs(popular);

        const topRated = await ClientGigService.getTopRatedGigs(6);
        setTopRatedGigs(topRated);

        // Only fetch care needs if user is authenticated
        if (isAuthenticated && user) {
          try {
            const careNeeds = await ClientCareNeedsService.getCareNeeds();
            setClientCareNeeds(careNeeds);
            const hasNeeds = !!(careNeeds && careNeeds.serviceCategories && careNeeds.serviceCategories.length > 0);
            setCareNeedsSet(hasNeeds);
            
            // Calculate matched services if we have care needs
            if (hasNeeds && allGigs.length > 0) {
              const matched = calculateMatchScores(allGigs, careNeeds);
              setMatchedServices(matched);
            }
          } catch (error) {
            console.warn("Could not fetch care needs:", error);
            setCareNeedsSet(false);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (services.length === 0) return;

    const filtered = ClientGigService.applyAdvancedFilters(services, filters);
    setFilteredServices(filtered);
  }, [filters, services]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Check if any filters or search are active
  const hasActiveFiltersOrSearch = () => {
    return filters.quickFilter ||
      filters.sortBy ||
      filters.serviceType ||
      filters.location ||
      filters.minRating ||
      filters.priceRange.min ||
      filters.priceRange.max ||
      filters.searchTerm;
  };

  // Check if viewing a specific category
  const isViewingCategory = () => {
    return activeCategory !== null && activeCategory !== undefined && activeCategory !== '';
  };

  // Check if components should be hidden during search
  const shouldHideComponents = () => {
    return isActivelySearching || 
      (filters.searchTerm && filters.searchTerm.trim() !== '') ||
      isViewingCategory();
  };

  // Get the page title based on current state
  const getPageTitle = () => {
    if (activeCategory) {
      return activeCategory;
    }
    if (filters.searchTerm) {
      return `Search Results for "${filters.searchTerm}"`;
    }
    if (hasActiveFiltersOrSearch()) {
      return "Filtered Services";
    }
    return "All Services";
  };

  // Handle clearing category filter
  const handleClearCategory = () => {
    setActiveCategory(null);
    setFilters(prevFilters => ({
      ...prevFilters,
      serviceType: ''
    }));
    // Update URL to remove category param
    navigate('/marketplace', { replace: true });
  };

  // Handle TopBanner button click - smart navigation based on auth status
  const handleBookCaregiver = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      navigate('/app/client/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        {/* Marketplace Hero with categories, banner, and filters */}
        {!shouldHideComponents() && (
          <MarketplaceHero
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Filter bar when actively searching */}
        {shouldHideComponents() && (
          <>
            {/* Category Header when viewing a specific category */}
            {isViewingCategory() && activeCategory && (
              <div className="category-page-header">
                <div className="category-header-content">
                  <button 
                    className="back-to-marketplace"
                    onClick={handleClearCategory}
                  >
                    ← Back to Marketplace
                  </button>
                  <h1 className="category-title">{activeCategory}</h1>
                  <p className="category-subtitle">
                    Browse {filteredServices.length} {activeCategory.toLowerCase()} services
                  </p>
                </div>
              </div>
            )}
            <FilterBarDropdown filters={filters} onFilterChange={handleFilterChange} />
          </>
        )}

        {loading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="service-categories">
            {/* Matched For You Section - Show when user has care needs */}
            {isAuthenticated && careNeedsSet && matchedServices.length > 0 && (isMatchedMode || !hasActiveFiltersOrSearch()) && (
              <div className="matched-services-section">
                <div className="matched-header">
                  <div className="matched-title-row">
                    <span className="matched-icon">🎯</span>
                    <h2>Matched For You</h2>
                    <span className="matched-badge">{matchedServices.length} matches</span>
                  </div>
                  <p className="matched-subtitle">Caregivers that best match your care preferences</p>
                </div>
                <div className="matched-services-grid">
                  {matchedServices.slice(0, 6).map((service) => (
                    <div 
                      key={service.id} 
                      className="matched-service-card"
                      onClick={() => navigate(`/marketplace/service/${service.id}`)}
                    >
                      <div className="match-score-badge">
                        <span className="score">{service.matchScore}%</span>
                        <span className="label">match</span>
                      </div>
                      <div className="card-image">
                        <img 
                          src={service.gigImage || service.image1 || 'https://via.placeholder.com/300x180?text=Care+Service'} 
                          alt={service.title} 
                        />
                        {service.caregiverIsVerified && (
                          <span className="verified-badge">✓ Verified</span>
                        )}
                      </div>
                      <div className="card-content">
                        <h3>{service.title}</h3>
                        <div className="caregiver-info">
                          <img 
                            src={service.caregiverProfileImage || '/avatar.jpg'} 
                            alt={service.caregiverName}
                            className="caregiver-avatar"
                          />
                          <span className="caregiver-name">{service.caregiverName}</span>
                          {service.caregiverRating > 0 && (
                            <span className="rating">★ {service.caregiverRating.toFixed(1)}</span>
                          )}
                        </div>
                        <div className="match-reasons">
                          {service.matchReasons.map((reason, idx) => (
                            <span key={idx} className="reason-tag">{reason}</span>
                          ))}
                        </div>
                        <div className="card-footer">
                          <span className="price">₦{(service.price || 0).toLocaleString()}/{service.priceUnit || 'hr'}</span>
                          <button className="view-btn">View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {matchedServices.length > 6 && (
                  <button 
                    className="see-all-matches-btn"
                    onClick={() => navigate('/marketplace?matched=true')}
                  >
                    See All {matchedServices.length} Matches
                  </button>
                )}
              </div>
            )}

            {/* Show categories if no filters or search are active */}
            {!hasActiveFiltersOrSearch() && (
              <>
                {popularGigs.length > 0 && (
                  <ServiceCategory
                    title="Popular Services"
                    services={popularGigs}
                    seeMoreLink="/dashboard?filter=popular"
                    isPublic={!isAuthenticated}
                  />
                )}

                {/* Suggested Services Section */}
                <SuggestedServices />

                {topRatedGigs.length > 0 && (
                  <ServiceCategory
                    title="Top Rated Services"
                    services={topRatedGigs}
                    seeMoreLink="/dashboard?filter=top-rated"
                    isPublic={!isAuthenticated}
                  />
                )}
              </>
            )}

            <ServiceCategory
              title={getPageTitle()}
              services={filteredServices}
              isPublic={!isAuthenticated}
            />

            {filteredServices.length === 0 && hasActiveFiltersOrSearch() && (
              <div className="no-results">
                <h3>No services found</h3>
                <p>
                  {filters.searchTerm
                    ? `No results found for "${filters.searchTerm}". Try searching for something else or adjusting your filters.`
                    : "Try adjusting your filters or search for something else."
                  }
                </p>
                <div className="reset-buttons">
                  {filters.searchTerm && (
                    <button
                      className="reset-button search-reset"
                      onClick={() => {
                        setFilters(prevFilters => ({
                          ...prevFilters,
                          searchTerm: ''
                        }));
                        setIsActivelySearching(false);
                        // Clear the URL search parameter
                        window.history.pushState({}, '', location.pathname);
                        // Notify navigation bar to clear search input
                        window.dispatchEvent(new CustomEvent('clearSearch'));
                      }}
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    className="reset-button"
                    onClick={() => {
                      setFilters({
                        sortBy: '',
                        priceRange: { min: '', max: '' },
                        serviceType: '',
                        location: '',
                        minRating: '',
                        quickFilter: '',
                        searchTerm: ''
                      });
                      setIsActivelySearching(false);
                      // Clear the URL search parameter
                      window.history.pushState({}, '', location.pathname);
                      // Notify navigation bar to clear search input
                      window.dispatchEvent(new CustomEvent('clearSearch'));
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Subtle call-to-action for unauthenticated users when no results */}
            {!isAuthenticated && filteredServices.length === 0 && !hasActiveFiltersOrSearch() && (
              <div>
                {/* 
                <div className="public-subtle-cta">
                <div className="subtle-cta-content">
                  <h3>🎯 Get Personalized Matches</h3>
                  <p>Sign up to receive tailored caregiver recommendations based on your specific needs.</p>
                  <div className="subtle-cta-buttons">
                    <button 
                      className="subtle-cta-primary"
                      onClick={() => navigate('/register')}
                    >
                      Sign Up Free
                    </button>
                    <button 
                      className="subtle-cta-secondary"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
              */}
                <QualityHealthCareCards />
                <div className="dashboard-book-caregiver">
                  <TopBanner
                    title="Your wellness starts here"
                    description="Take charge of your health and break free from the limitations to a fulfilling life with your loved ones. It’s time to prioritise your well-being"
                    buttonText="Hire a Caregiver"
                    imageUrl={genralImg}
                    onButtonClick={handleBookCaregiver}
                    backgroundColor="#373732"
                  />
                </div>
                <div>
                    <CareFacts />
                </div>
                <div className="dashboard-book-caregiver">
                  <TopBanner
                    title="Become a Caregiver"
                    description="As a caregiver, you are provided the opportunity to support your patients while also building a rewarding career in healthcare. Take the first step today!"
                    buttonText="Become a Caregiver"
                    imageUrl={genralImg}
                    onButtonClick={handleBookCaregiver}
                    backgroundColor="#324CA6"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMarketplace;
