
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import Banner from "./Banner";
import ServiceCategory from "./ServiceCategory";
import FilterBarDropdown from "../components/FilterBar";
import ClientGigService from "../../../services/clientGigService";

import CareMatchBanner from "./CareMatchBanner";



const ClientDashboard = () => {
  const location = useLocation();
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
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

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

        // const careNeeds = await ClientCareNeedsService.getCareNeeds();
        // setCareNeedsSet(!!(careNeeds && careNeeds.primaryCondition));
      } catch (error) {
        console.error("Error fetching services:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        {!shouldHideComponents() && (
          <Banner
            name={`${user.firstName} ${user.lastName}`}
            careNeedsSet={careNeedsSet}
          />
        )}

        {!shouldHideComponents() && (
          <div className="mid-banner">
            <CareMatchBanner />
          </div>
        )}

        {!shouldHideComponents() && (
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
                    />
                  )}

                  {topRatedGigs.length > 0 && (
                    <ServiceCategory
                      title="Top Rated Services"
                      services={topRatedGigs}
                      seeMoreLink="/dashboard?filter=top-rated"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;


