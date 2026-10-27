import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import "./serviceCategory.css";
import "./marketplaceHero.css";
import "./publicMarketplace.css";
// RETIRED (marketplace follows the client-dashboard package pattern): the per-tier PackageCard list, whose cards
// had differing heights. Preserved for restore.
// import PackageCard from "./PackageCard";
import PackageCategoryCard from "../../../../components/category/PackageCategoryCard";
import { PACKAGE_CATEGORIES } from "../../../constants/categoryBrowseData";
import { getPackageSelectNavigation } from "../../../utils/packageSelectNavigation";
import ClientPackageService from "../../../services/clientPackageService";
import PublicPackageService from "../../../services/publicPackageService";
import { trackEvent } from "../../../services/analyticsService";

const SORT_OPTIONS = [
  { value: "default", label: "Category" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

/**
 * Care packages, laid out exactly like the client dashboard: one shared PackageCategoryCard per real package category
 * (expandable tier rows), same grid, same equal-height cards.
 *  - Logged out: anonymous GET /public/packages (price-free summaries, no auth, no caregiver/gig data). Selecting a tier
 *    follows the public home-page rule (sign up, then return here).
 *  - Logged in: the authenticated catalog (GET /client/packages) with prices, like the dashboard; selecting a tier goes
 *    to the free-assessment intake pre-filled with that package, exactly what the dashboard does.
 */
const PublicMarketplace = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Read ?category= and ?q= from the URL so links from the homepage, dashboard, etc.
  // actually pre-filter the catalog instead of silently landing on "All categories".
  useEffect(() => {
    setCategory(searchParams.get("category") || "");
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  // Track marketplace page view (and Meta Pixel ViewContent for ad attribution)
  useEffect(() => {
    trackEvent('page_view', 'marketplace');
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'ViewContent', { content_name: 'marketplace' });
    }
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    // Previously: always ClientPackageService.getPackages() (authenticated) behind a sign-in wall.
    const result = isAuthenticated
      ? await ClientPackageService.getPackages()
      : await PublicPackageService.getPackageSummaries();
    if (result.success) {
      setPackages(result.data);
    } else {
      setPackages([]);
      setError("We couldn't load care packages right now. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return; // wait until we know who is looking, so a signed-in client never flashes the price-free list
    // RETIRED — logged-out visitors used to get a sign-in wall and no fetch:
    // if (!isAuthenticated) { setLoading(false); return; }
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Same destinations as the places these cards already live:
  //  - signed in: the free-assessment intake pre-filled with the package (what the dashboard cards do);
  //  - signed out: the public home-page rule (sign up first, then land back here on that package).
  //  - a category with no tier rows: this page, filtered to the category.
  const handleSelectPackage = (cat, tier) => {
    trackEvent('select_package', 'marketplace');
    if (!tier) {
      navigate(`/marketplace?category=${encodeURIComponent(cat.category)}`);
      return;
    }
    if (isAuthenticated) {
      const params = new URLSearchParams({ category: cat.category, tier: tier.tierLabel });
      navigate(`/start-assessment?${params.toString()}`);
      return;
    }
    navigate(getPackageSelectNavigation({ isAuthenticated: false, category: cat.category, tierLabel: tier.tierLabel }));
  };

  const categories = useMemo(() => {
    const unique = new Set(packages.map((pkg) => pkg.category).filter(Boolean));
    return Array.from(unique);
  }, [packages]);

  const visiblePackages = useMemo(() => {
    let result = packages;

    if (category) {
      result = result.filter((pkg) => pkg.category === category);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((pkg) => {
        const haystack = [
          pkg.category,
          pkg.tierLabel,
          pkg.description,
          pkg.requiredCaregiverType,
          pkg.requiredSpecialty,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
    }

    // Price sorting only means something when prices are present (signed in); it orders the tiers inside each card.
    if (isAuthenticated && sortBy === "price_asc") {
      result = [...result].sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    } else if (isAuthenticated && sortBy === "price_desc") {
      result = [...result].sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
    }

    return result;
  }, [packages, category, searchTerm, sortBy, isAuthenticated]);

  // eslint-disable-next-line no-unused-vars -- kept for the retired per-tier list above
  const groupedByCategory = useMemo(() => {
    const groups = [];
    const indexByCategory = new Map();
    visiblePackages.forEach((pkg) => {
      const key = pkg.category || "Other";
      if (!indexByCategory.has(key)) {
        indexByCategory.set(key, groups.length);
        groups.push({ category: key, items: [] });
      }
      groups[indexByCategory.get(key)].items.push(pkg);
    });
    return groups;
  }, [visiblePackages]);

  // RETIRED — logged-out visitors used to see this sign-in wall instead of the packages. The marketplace is now open to
  // visitors (price-free cards from the public endpoint). Preserved for restore.
  // if (!isAuthenticated) {
  //   return (
  //     <div className="dashboard client-dashboard-flex">
  //       <div className="rightbar">
  //         <div className="no-results">
  //           <h3>Sign in to view care packages</h3>
  //           <p>Care packages are available to signed-in clients. Log in or create an account to browse what's available.</p>
  //           <div className="reset-buttons">
  //             <button className="reset-button" onClick={() => navigate(`/login?returnTo=${encodeURIComponent(`/marketplace${window.location.search}`)}`)}>Login</button>
  //             <button className="reset-button search-reset" onClick={() => navigate(`/register?returnTo=${encodeURIComponent(`/marketplace${window.location.search}`)}`)}>Sign Up</button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <div className="category-page-header">
          <div className="category-header-content">
            <h1 className="category-title">Care Packages</h1>
            <p className="category-subtitle">
              {isAuthenticated
                ? "Browse available care packages and pick the one that fits your needs."
                : "Browse our care packages. Tap a package for details."}
            </p>
          </div>
        </div>

        {!loading && !error && packages.length > 0 && (
          <div className="marketplace-filters marketplace-filters--packages">
            <select
              className="marketplace-filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              className="marketplace-filter-select"
              placeholder="Search packages"
              aria-label="Search packages"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {isAuthenticated && (
              <select
                className="marketplace-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort packages within each card"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {(loading || authLoading) && (
          <p className="suggested-services-note marketplace-pkg-note" role="status">Loading care packages…</p>
        )}

        {!loading && !authLoading && error && (
          <div className="no-results">
            <h3>We couldn't load care packages</h3>
            <p>{error}</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={fetchPackages}>Try Again</button>
            </div>
          </div>
        )}

        {!loading && !authLoading && !error && packages.length === 0 && (
          <div className="no-results">
            <h3>No care packages available yet</h3>
            <p>Check back soon — new care packages are added regularly.</p>
          </div>
        )}

        {!loading && !authLoading && !error && packages.length > 0 && visiblePackages.length === 0 && (
          <div className="no-results">
            <h3>No packages found</h3>
            <p>Try adjusting your search or category filter.</p>
            <div className="reset-buttons">
              <button
                className="reset-button"
                onClick={() => {
                  setCategory("");
                  setSearchTerm("");
                  setSortBy("default");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* RETIRED — one PackageCard per tier, grouped under a category heading (cards of unequal height):
        {!loading && !error && groupedByCategory.map((group) => (
          <div className="service-category" key={group.category}>
            <div className="category-header">
              <h2>{group.category}</h2>
            </div>
            <div className="service-list">
              {group.items.map((pkg) => (
                <PackageCard key={pkg.id} {...pkg} onSelect={handleSelectPackage} />
              ))}
            </div>
          </div>
        ))}
        */}

        {/* Dashboard pattern: one shared PackageCategoryCard per real package category. */}
        {!loading && !authLoading && !error && visiblePackages.length > 0 && (
          <div className="marketplace-pkg-section">
            <div
              className={`pkg-cat-grid${isAuthenticated ? " pkg-cat-grid--priced" : ""}`}
              aria-label="Care package categories"
              data-testid="marketplace-pkg-grid"
            >
              {PACKAGE_CATEGORIES
                .filter((cat) => visiblePackages.some((p) => p.category === cat.category))
                .map((cat) => (
                  <PackageCategoryCard
                    key={cat.category}
                    category={cat}
                    tiers={visiblePackages.filter((p) => p.category === cat.category)}
                    onSelect={handleSelectPackage}
                    showPrice={isAuthenticated}
                    selectLabel={isAuthenticated ? "Select this package" : undefined}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMarketplace;
