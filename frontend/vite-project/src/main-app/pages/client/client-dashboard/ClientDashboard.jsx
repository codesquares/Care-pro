
import React, { useState, useEffect } from "react";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import Banner from "./Banner";
import ServiceCategory from "./ServiceCategory";
import FilterBarDropdown from "../components/FilterBar";
import ClientGigService from "../../../services/clientGigService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";
import CareMatchBanner from "./CareMatchBanner";

const ClientDashboard = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [popularGigs, setPopularGigs] = useState([]);
  const [topRatedGigs, setTopRatedGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    sortBy: '',
    priceRange: { min: '', max: '' },
    serviceType: '',
    location: '',
    minRating: '',
    quickFilter: ''
  });

  const [careNeedsSet, setCareNeedsSet] = useState(false);
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

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

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <Banner
          name={`${user.firstName} ${user.lastName}`}
          careNeedsSet={careNeedsSet}
        />

        <div className="mid-banner">
          <CareMatchBanner />
        </div>

        <FilterBarDropdown filters={filters} onFilterChange={handleFilterChange} />

        {loading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="service-categories">
            {/* Show categories if no filters are active */}
            {!filters.quickFilter &&
              !filters.sortBy &&
              !filters.serviceType &&
              !filters.location &&
              !filters.minRating &&
              !filters.priceRange.min &&
              !filters.priceRange.max && (
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
                filters.quickFilter ||
                filters.sortBy ||
                filters.serviceType ||
                filters.location ||
                filters.minRating ||
                filters.priceRange.min ||
                filters.priceRange.max
                  ? "Filtered Services"
                  : "All Services"
              }
              services={filteredServices}
            />

            {filteredServices.length === 0 && (
              <div className="no-results">
                <h3>No services found</h3>
                <p>Try adjusting your filters or search for something else.</p>
                <button
                  className="reset-button"
                  onClick={() =>
                    handleFilterChange({
                      sortBy: '',
                      priceRange: { min: '', max: '' },
                      serviceType: '',
                      location: '',
                      minRating: '',
                      quickFilter: ''
                    })
                  }
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;


