import React, { useState, useEffect } from "react";
import "./clientDashboard.css";
import "./responsiveFixes.css"; // Import special fixes for responsiveness
import Banner from "./Banner";
import ServiceCategory from "./ServiceCategory";
import FilterBar from "../components/FilterBar";
import ClientProfileCard from "./ClientProfileCard";
import SidebarActions from "./SidebarActions";
import ClientGigService from "../../../services/clientGigService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";

const ClientDashboard = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [popularGigs, setPopularGigs] = useState([]);
  const [topRatedGigs, setTopRatedGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // State for filter visibility
  const [filters, setFilters] = useState({
    sortBy: '',
    priceRange: { min: '', max: '' },
    serviceType: '',
    location: '',
    minRating: '',
    quickFilter: ''
  });
  
  // Check if care needs are set
  const [careNeedsSet, setCareNeedsSet] = useState(false);

  // Get user data from local storage
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

  // Fetch services on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all gigs using our service
        const allGigs = await ClientGigService.getAllGigs();
        setServices(allGigs);
        
        // Apply initial filtering
        const filtered = ClientGigService.applyAdvancedFilters(allGigs, filters);
        setFilteredServices(filtered);
        
        // Get popular gigs for quick access
        const popular = await ClientGigService.getPopularGigs(6);
        setPopularGigs(popular);
        
        // Get top-rated gigs for quick access
        const topRated = await ClientGigService.getTopRatedGigs(6);
        setTopRatedGigs(topRated);
        
        // Check if care needs are set
        // const careNeeds = await ClientCareNeedsService.getCareNeeds();
        // setCareNeedsSet(careNeeds && careNeeds.primaryCondition ? true : false);
        
      } catch (error) {
        console.error("Error fetching services:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (services.length === 0) return;
    
    // Use our service to apply advanced filters
    const filtered = ClientGigService.applyAdvancedFilters(services, filters);
    setFilteredServices(filtered);
    
  }, [filters, services]);

  // Handle filter changes from FilterBar
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="dashboard client-dashboard-flex">
      {/* Left Sidebar */}
      <div className="leftbar">
        <ClientProfileCard />
        {/* <SidebarActions /> */}
      </div>
      
      {/* Main Content */}
      <div className="rightbar">
        <Banner 
          name={user.firstName + " " + user.lastName}
          careNeedsSet={careNeedsSet} 
        />
        
        {/* Filter Toggle Button */}
        <div className="filter-toggle-container">
          <button 
            className={`filter-toggle-button ${showFilters ? 'active' : ''}`}
            onClick={toggleFilters}
          >
            <i className={`fas ${showFilters ? 'fa-times' : 'fa-filter'}`}></i>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {/* Show filter count if filters are applied and filter bar is hidden */}
          {!showFilters && (
            Object.values(filters).some(val => 
              val && (typeof val === 'string' ? val.trim() !== '' : 
                    typeof val === 'object' ? Object.values(val).some(v => v !== '') : true)
            ) && (
              <span className="active-filters-badge">Filters active</span>
            )
          )}
        </div>
        
        {/* Conditionally render the FilterBar */}
        {showFilters && <FilterBar onFilterChange={handleFilterChange} />}
        
        {/* Content States */}
        {loading && <p className="loading-message">Loading services...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && (
          <>
            {/* Show quick access categories if no filter is active */}
            {!filters.quickFilter && !filters.sortBy && !filters.serviceType && !filters.location && !filters.minRating && 
              !filters.priceRange.min && !filters.priceRange.max && (
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
            
            {/* Always show filtered results */}
            <ServiceCategory 
              title={filters.quickFilter || filters.sortBy || filters.serviceType || filters.location || 
                    filters.minRating || filters.priceRange.min || filters.priceRange.max ? 
                    "Filtered Services" : "All Services"} 
              services={filteredServices} 
            />
            
            {filteredServices.length === 0 && (
              <div className="no-results">
                <h3>No services found</h3>
                <p>Try adjusting your filters or search for something else.</p>
                <button className="reset-button" onClick={() => handleFilterChange({
                  sortBy: '',
                  priceRange: { min: '', max: '' },
                  serviceType: '',
                  location: '',
                  minRating: '',
                  quickFilter: ''
                })}>
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
