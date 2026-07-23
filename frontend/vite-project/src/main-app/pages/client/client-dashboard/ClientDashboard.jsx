
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import ClientDashboardHero from "./ClientDashboardHero";
import ServiceCategory from "./ServiceCategory";
import FilterBarDropdown from "../components/FilterBar";
import ClientGigService from "../../../services/clientGigService";
import ClientProfileService from "../../../services/clientProfileService";
import ClientCareNeedsService from "../../../services/clientCareNeedsService";
import accountDeletionService from "../../../services/accountDeletionService";
import { useClientOnboarding } from '../../../context/ClientOnboardingContext';
import PendingCommitmentBanner from '../../../components/PendingCommitmentBanner';




const ClientDashboard = () => {
  const location = useLocation();
  const {
    isCanonicalClientRoute,
    isTipSeen,
    markTipSeen,
    setMarketplaceFilterContext,
  } = useClientOnboarding();
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
  const [profileCompletion, setProfileCompletion] = useState(10);
  const [pendingDeletionDate, setPendingDeletionDate] = useState(null);
  const [showDeletionBanner, setShowDeletionBanner] = useState(true);
  const [cancelDeletionLoading, setCancelDeletionLoading] = useState(false);
  const [showCancelDeletionConfirm, setShowCancelDeletionConfirm] = useState(false);
  const user = JSON.parse(localStorage.getItem("userDetails") || "{}");

  // Calculate profile completion percentage from real data
  const calculateProfileCompletion = (profile, hasCareNeeds) => {
    const fields = [
      { check: () => !!profile?.firstName, weight: 10 },
      { check: () => !!profile?.lastName, weight: 10 },
      { check: () => !!profile?.email, weight: 10 },
      { check: () => !!profile?.phoneNumber, weight: 15 },
      { check: () => !!profile?.location, weight: 15 },
      { check: () => !!profile?.bio, weight: 10 },
      { check: () => !!profile?.profilePicture && profile.profilePicture !== '', weight: 15 },
      { check: () => !!profile?.isVerified, weight: 5 },
      { check: () => hasCareNeeds, weight: 10 },
    ];
    return fields.reduce((sum, f) => sum + (f.check() ? f.weight : 0), 0);
  };

  // Fetch profile and care needs to compute completion
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const clientId = user?.id;
        if (!clientId) return;

        const [profile, careNeeds] = await Promise.all([
          ClientProfileService.getProfile(clientId).catch(() => null),
          ClientCareNeedsService.getCareNeeds().catch(() => null),
        ]);

        const hasCareNeeds = !!(careNeeds?.serviceCategories && careNeeds.serviceCategories.length > 0);
        setCareNeedsSet(hasCareNeeds);
        setProfileCompletion(calculateProfileCompletion(profile, hasCareNeeds));

        // Check for pending account deletion
        if (profile?.accountDeletionRequestedAt) {
          const deletionDate = new Date(
            new Date(profile.accountDeletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
          );
          setPendingDeletionDate(deletionDate);
        }
      } catch (err) {
        console.warn('Could not fetch profile completion data:', err);
      }
    };
    fetchProfileData();
  }, [user?.id]);

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

  const [marketplaceTipDismissed, setMarketplaceTipDismissed] = useState(false);
  const [marketplaceTipInitiallySeen] = useState(() => isTipSeen('tip_marketplace_discovery'));
  const showMarketplaceTip =
    isCanonicalClientRoute &&
    !marketplaceTipDismissed &&
    !marketplaceTipInitiallySeen;

  useEffect(() => {
    setMarketplaceFilterContext(filters);
  }, [filters, setMarketplaceFilterContext]);

  useEffect(() => {
    if (!showMarketplaceTip) return;

    markTipSeen({
      tipKey: 'tip_marketplace_discovery',
      context: {
        route: location.pathname,
      },
    });
  }, [location.pathname, markTipSeen, showMarketplaceTip]);

  // Check if components should be hidden during search
  const shouldHideComponents = () => {
    return isActivelySearching || (filters.searchTerm && filters.searchTerm.trim() !== '');
  };

  return (
    <div className="dashboard client-dashboard-flex">
      <PendingCommitmentBanner />

      {/* Pending deletion banner */}
      {pendingDeletionDate && showDeletionBanner && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
          padding: '0.875rem 1rem', margin: '0 0 0.75rem', display: 'flex',
          alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🗑️</span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#9a3412' }}>
              Your account is scheduled for permanent deletion on{' '}
              {pendingDeletionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#c2410c' }}>
              Cancel this request before that date to restore your account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowCancelDeletionConfirm(true)}
              style={{
                background: '#ea580c', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '0.4rem 0.9rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              Cancel Deletion
            </button>
            <button
              onClick={() => setShowDeletionBanner(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#9a3412', fontSize: '1.1rem', lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Cancel deletion confirm overlay */}
      {showCancelDeletionConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={() => setShowCancelDeletionConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '10px', padding: '1.5rem',
              maxWidth: '420px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Cancel Account Deletion?</h3>
            <p>Are you sure you want to cancel your deletion request? Your account will be fully restored immediately.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowCancelDeletionConfirm(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
                }}
              >
                No, keep scheduled
              </button>
              <button
                disabled={cancelDeletionLoading}
                onClick={async () => {
                  setCancelDeletionLoading(true);
                  try {
                    await accountDeletionService.cancelClientDeletion();
                    setPendingDeletionDate(null);
                    setShowDeletionBanner(false);
                    setShowCancelDeletionConfirm(false);
                  } catch (err) {
                    setShowCancelDeletionConfirm(false);
                    if (err.response?.status === 401) {
                      alert('Your session has expired. Use the "Cancel my deletion request" link in your scheduled-deletion email. After 30 days contact codesquareltd@gmail.com.');
                    } else if (err.response?.status === 400) {
                      alert(err.response?.data?.message || 'Your grace period has ended. Account deletion cannot be cancelled.');
                    } else {
                      alert('Failed to cancel account deletion. Please try again.');
                    }
                  } finally {
                    setCancelDeletionLoading(false);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {cancelDeletionLoading ? 'Processing...' : 'Yes, Cancel Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rightbar">
        {!shouldHideComponents() && (
          <ClientDashboardHero
            userName={user.firstName || 'User'}
            profileCompletion={profileCompletion}
            remindersCount={3}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        )}

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
            {showMarketplaceTip && (
              <div className="client-tip-banner" role="note">
                <div>
                  <strong>Marketplace tip</strong>
                  <p>Use search, category, and filters together to narrow down to matching caregivers quickly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMarketplaceTipDismissed(true);
                    markTipSeen({
                      tipKey: 'tip_marketplace_discovery',
                      context: {
                        route: location.pathname,
                        dismissed: true,
                      },
                    });
                  }}
                >
                  Dismiss
                </button>
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


