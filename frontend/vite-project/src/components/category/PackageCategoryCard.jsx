import "../../styles/components/packageCategoryCard.css";
import CategoryIllustration from "./CategoryIllustration";

const CAREGIVER_TYPE_LABELS = {
  AuxiliaryNurse: "Auxiliary Nurse",
  CHEW: "CHEW",
  RegisteredNurse: "Registered Nurse",
};

// Seed rows for packages whose real copy hasn't been written yet carry a "to be added"
// placeholder. Never publish that.
const isPlaceholderDescription = (text) => /to be added/i.test(text || "");

// The tier list scrolls inside a fixed-height card, so when a row opens make sure it is fully
// visible. `nearest` only scrolls as far as needed (and not at all if it already fits).
const keepOpenTierInView = (event) => {
  const el = event.currentTarget;
  if (el.open && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
};

const formatNaira = (amount) => `₦${Number(amount).toLocaleString()}`;

/**
 * Card for one real package category: icon, name, and one expandable row per tier (label,
 * caregiver type, description). Expanding a tier is purely informational. Only the select
 * button leaves the page.
 *
 * Shared by the public homepage (price-free data, `showPrice` off) and the signed-in dashboard
 * (authenticated data with `basePrice`, `showPrice` on). A tier without a price never renders
 * one, so the same component is safe with either data source.
 */
const PackageCategoryCard = ({
  category,
  tiers,
  onSelect,
  showPrice = false,
  selectLabel = "View pricing & select",
}) => {
  return (
    <article className="pkg-cat-card">
      <div className="pkg-cat-card__art" aria-hidden="true">
        <CategoryIllustration slug={category.slug} />
      </div>
      <div className="pkg-cat-card__body">
        <div className="pkg-cat-card__heading">
          {tiers.length > 0 && (
            <span className="pkg-cat-card__eyebrow">
              {tiers.length} {tiers.length === 1 ? "package" : "packages"}
            </span>
          )}
          <h3>{category.name}</h3>
        </div>
        {tiers.length > 0 && (
          <ul className="pkg-cat-card__tiers">
            {tiers.map((tier) => {
              const showDescription = tier.description && !isPlaceholderDescription(tier.description);
              const hasPrice = showPrice && tier.basePrice > 0;
              return (
                <li key={tier.tierLabel}>
                  <details className="pkg-cat-card__tier" onToggle={keepOpenTierInView}>
                    <summary>
                      <span className="pkg-cat-card__tier-main">
                        <span className="pkg-cat-card__tier-label">{tier.tierLabel}</span>
                        <span className="pkg-cat-card__tier-sub">
                          <span className="pkg-cat-card__chip">
                            {CAREGIVER_TYPE_LABELS[tier.requiredCaregiverType] || tier.requiredCaregiverType}
                          </span>
                          {hasPrice && (
                            <span className="pkg-cat-card__price">From {formatNaira(tier.basePrice)}</span>
                          )}
                        </span>
                      </span>
                      <span className="pkg-cat-card__chevron" aria-hidden="true">›</span>
                    </summary>
                    <div className="pkg-cat-card__tier-body">
                      {showDescription && <p>{tier.description}</p>}
                      {hasPrice && tier.additionalDayPrice > 0 && (
                        <p className="pkg-cat-card__extra">+{formatNaira(tier.additionalDayPrice)} per additional day</p>
                      )}
                      <button
                        type="button"
                        className="pkg-cat-card__select"
                        onClick={() => onSelect(category, tier)}
                      >
                        {selectLabel} <span aria-hidden="true">›</span>
                      </button>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        {tiers.length > 0 && (
          <p className="pkg-cat-card__hint">Tap a package for details</p>
        )}
        {tiers.length === 0 && (
          <button type="button" className="pkg-cat-card__select" onClick={() => onSelect(category, null)}>
            Browse {category.name} packages <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
    </article>
  );
};

export default PackageCategoryCard;
