import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import Banner from "./Banner";
import ServiceCategory from "./ServiceCategory";
import FilterBarDropdown from "../components/FilterBar";
import ClientGigService from "../../../services/clientGigService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";
import CareMatchBanner from "./CareMatchBanner";
import QualityHealthCareCards from "../../../../components/QualityHealthCareCards";
import TopBanner from "../../../../components/TopBanner";
import genralImg from "../../../../assets/nurseAndWoman.png";
import CareFacts from "../../../../components/LandingPage/HealthcareFacts";
import Nurse from "../../../../assets/nurse.png";
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
  // Handle TopBanner button click - smart navigation based on auth status
  const handleBookCaregiver = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      // Authenticated clients go to dashboard to browse gigs
      navigate('/app/client/dashboard');
    } else {
      // Non-authenticated users go to register
      navigate('/register');
    }
  };

  // Extract search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('q');
    setFilters(prevFilters => ({
      ...prevFilters,
      searchTerm: searchQuery || ''
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
            setCareNeedsSet(!!(careNeeds && careNeeds.primaryCondition));
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

  // Check if components should be hidden during search
  const shouldHideComponents = () => {
    return isActivelySearching || (filters.searchTerm && filters.searchTerm.trim() !== '');
  };

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        {/* Only show banner for authenticated users, exactly like ClientDashboard */}
        {!shouldHideComponents() && (
          <Banner
            name={`Guest User`}
            careNeedsSet={false}
          />
        )}

        {/* Only show CareMatch banner for authenticated users */}
        {!shouldHideComponents() && (
          <div className="mid-banner">
            <CareMatchBanner />
          </div>
        )}

        {/* Filter bar available to all users */}
        {shouldHideComponents() && (
          <FilterBarDropdown filters={filters} onFilterChange={handleFilterChange} />
        )}

        {loading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="service-categories">
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
              title={
                hasActiveFiltersOrSearch()
                  ? filters.searchTerm
                    ? `Search Results${filters.searchTerm ? ` for "${filters.searchTerm}"` : ''}`
                    : "Filtered Services"
                  : "All Services"
              }
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
                    imageUrl={Nurse}
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
