import "../../styles/components/categoryCard.css";
import CategoryIllustration from "./CategoryIllustration";

const CategoryCard = ({
  category,
  onClick,
  className = "",
  showDescription = true,
  showPrice = true,
  priceContent,
}) => {
  const isCompact = !showDescription && !showPrice;
  const isPriceOnly = !showDescription && showPrice;
  const resolvedPriceContent =
    priceContent ?? (
      <>
        Starting at ₦{category.basePrice.toLocaleString()} /visit
      </>
    );

  const modifierClasses = [
    isCompact ? "category-card--compact" : "",
    isPriceOnly ? "category-card--price-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={`category-card ${modifierClasses} ${className}`.trim()}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="category-card__art" aria-hidden="true">
        <CategoryIllustration slug={category.slug} />
      </div>
      <div className="category-card__body">
        <h3>{category.name}</h3>
        {showDescription && <p>{category.description}</p>}
        {showPrice && <div className="category-card__price">{resolvedPriceContent}</div>}
      </div>
    </article>
  );
};

export default CategoryCard;
