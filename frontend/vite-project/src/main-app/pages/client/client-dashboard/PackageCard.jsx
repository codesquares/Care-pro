import "./packageCard.css";

const PackageCard = ({
  id,
  category,
  tierLabel,
  requiredCaregiverType,
  requiredSpecialty,
  description,
  basePrice,
  additionalDayPrice,
  onSelect,
}) => {
  const displayPrice = basePrice ? `₦${basePrice.toLocaleString()}` : "Contact for pricing";

  return (
    <div className="package-card">
      <div className="package-card-header">
        <span className="package-card-category">{category}</span>
        <h3 className="package-card-tier">{tierLabel}</h3>
      </div>

      {description && <p className="package-card-description">{description}</p>}

      {(requiredCaregiverType || requiredSpecialty) && (
        <div className="package-card-requirements">
          {requiredCaregiverType && (
            <span className="package-card-badge">{requiredCaregiverType}</span>
          )}
          {requiredSpecialty && (
            <span className="package-card-badge">{requiredSpecialty}</span>
          )}
        </div>
      )}

      <div className="package-card-footer">
        <div className="package-card-pricing">
          <span className="price-label">Starting at</span>
          <span className="price-amount">{displayPrice}</span>
        </div>
        {additionalDayPrice ? (
          <span className="package-card-additional">
            +₦{additionalDayPrice.toLocaleString()} per additional day
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="package-card-select-button"
        onClick={() => onSelect?.({ id, category, tierLabel })}
      >
        Select This Package
      </button>
    </div>
  );
};

export default PackageCard;
