import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./clientDashboard.css";
import "./responsiveFixes.css";
import PackageCard from "./PackageCard";
import ClientPackageService from "../../../services/clientPackageService";
import { trackEvent } from "../../../services/analyticsService";

const SORT_OPTIONS = [
  { value: "default", label: "Category" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PublicMarketplace = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

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
    const result = await ClientPackageService.getPackages();
    if (result.success) {
      setPackages(result.data);
    } else {
      setError("We couldn't load care packages right now. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchPackages();
  }, [isAuthenticated]);

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

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
    }

    return result;
  }, [packages, category, searchTerm, sortBy]);

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

  if (!isAuthenticated) {
    return (
      <div className="dashboard client-dashboard-flex">
        <div className="rightbar">
          <div className="no-results">
            <h3>Sign in to view care packages</h3>
            <p>Care packages are available to signed-in clients. Log in or create an account to browse what's available.</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={() => navigate('/login')}>Login</button>
              <button className="reset-button search-reset" onClick={() => navigate('/register')}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <div className="category-page-header">
          <div className="category-header-content">
            <h1 className="category-title">Care Packages</h1>
            <p className="category-subtitle">Browse available care packages and pick the one that fits your needs.</p>
          </div>
        </div>

        {!loading && !error && packages.length > 0 && (
          <div className="marketplace-filters" style={{ marginBottom: 20 }}>
            <select
              className="marketplace-filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="marketplace-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {!loading && error && (
          <div className="no-results">
            <h3>Something went wrong</h3>
            <p className="error-message">{error}</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={fetchPackages}>Try Again</button>
            </div>
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div className="no-results">
            <h3>No care packages available yet</h3>
            <p>Check back soon — new care packages are added regularly.</p>
          </div>
        )}

        {!loading && !error && packages.length > 0 && visiblePackages.length === 0 && (
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

        {!loading && !error && groupedByCategory.map((group) => (
          <div className="service-category" key={group.category}>
            <div className="category-header">
              <h2>{group.category}</h2>
            </div>
            <div className="service-list">
              {group.items.map((pkg) => (
                <PackageCard key={pkg.id} {...pkg} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicMarketplace;
