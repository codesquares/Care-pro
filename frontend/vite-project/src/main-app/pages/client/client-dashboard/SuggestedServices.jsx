import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./suggestedServices.css";
import PackageCategoryCard from "../../../../components/category/PackageCategoryCard";
import { PACKAGE_CATEGORIES } from "../../../constants/categoryBrowseData";
import ClientPackageService from "../../../services/clientPackageService";

/**
 * Signed-in package overview for the client dashboard: the same PackageCategoryCard as the public
 * homepage, but fed by the authenticated catalog (GET /client/packages) so real prices show.
 * Selecting a tier goes to the free-assessment intake pre-filled with that package — the same
 * action the marketplace's "Select This Package" performs.
 */
const SuggestedServices = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const load = useCallback(async () => {
    setStatus("loading");
    const result = await ClientPackageService.getPackages();
    if (result.success) {
      setPackages(result.data);
      setStatus("ready");
    } else {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = (category, tier) => {
    if (!tier) {
      navigate(`/marketplace?category=${encodeURIComponent(category.category)}`);
      return;
    }
    const params = new URLSearchParams({ category: category.category, tier: tier.tierLabel });
    navigate(`/start-assessment?${params.toString()}`);
  };

  return (
    <div className="suggested-services-section">
      <div className="suggested-services-header">
        <h2>Care packages</h2>
      </div>

      {status === "loading" && <p className="suggested-services-note">Loading care packages…</p>}

      {status === "error" && (
        <div className="suggested-services-note">
          <p>We couldn't load care packages right now.</p>
          <button type="button" className="pkg-cat-card__select" onClick={load}>Try again</button>
        </div>
      )}

      {status === "ready" && (
        <div className="pkg-cat-grid" aria-label="Care package categories">
          {PACKAGE_CATEGORIES.map((category) => (
            <PackageCategoryCard
              key={category.category}
              category={category}
              tiers={packages.filter((p) => p.category === category.category)}
              onSelect={handleSelect}
              showPrice
              selectLabel="Select this package"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestedServices;
