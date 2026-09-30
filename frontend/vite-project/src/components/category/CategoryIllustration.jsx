import babyBoyIcon from "../../../__mocks__/Baby boy.svg";
import blindIcon from "../../../__mocks__/Blind.svg";
import disabledPersonIcon from "../../../__mocks__/Disabled person.svg";
import homeIcon from "../../../__mocks__/Home.svg";
import meditationIcon from "../../../__mocks__/Meditation.svg";
import oldIcon from "../../../__mocks__/Old.svg";
import pharmacyIcon from "../../../__mocks__/Pharmacy.svg";
import stethoscopeIcon from "../../../__mocks__/Stethoscope.svg";
import wheelchairIcon from "../../../__mocks__/Wheelchair.svg";

const commonProps = {
  width: 150,
  height: 100,
  viewBox: "0 0 150 100",
  fill: "none",
};

const frame = (
  <>
    <rect x="16" y="10" width="118" height="80" rx="18" fill="var(--color-brand-mint-2)" />
    <rect x="16" y="10" width="118" height="80" rx="18" stroke="var(--color-brand-deep)" strokeOpacity="0.18" strokeWidth="2" />
  </>
);

const imageAlt = {
  "adult-care": "Adult care icon",
  "post-surgery-care": "Post surgery care icon",
  "child-care": "Child care icon",
  "pet-care": "Pet care icon",
  "home-care": "Home care icon",
  "medical-support": "Medical support icon",
  "mobility-support": "Mobility support icon",
  "therapy-wellness": "Therapy and wellness icon",
};

const imageIllustrations = {
  "adult-care": oldIcon,
  "post-surgery-care": stethoscopeIcon,
  "child-care": babyBoyIcon,
  "pet-care": blindIcon,
  "home-care": homeIcon,
  "medical-support": pharmacyIcon,
  "mobility-support": wheelchairIcon,
  "therapy-wellness": meditationIcon,
};

const vectorIllustrations = {
  // ── Real package categories (see PACKAGE_CATEGORIES in constants/categoryBrowseData.js) ──
  // Token-driven inline SVG (same 150x100 frame as `palliative`), so they follow the brand palette.
  "pkg-adult-elder-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="64" cy="33" r="9" fill="var(--color-brand-deep)" />
      <path d="M50 76c0-16 6-27 14-27s15 9 15 27z" fill="var(--color-brand-deep-2)" />
      <path d="M76 58l14-2" stroke="var(--color-brand-deep-2)" strokeWidth="5" strokeLinecap="round" />
      <path d="M91 55v22" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M91 55c0-7 9-7 9 0" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M108 44c-9-6-11-12-7-15 3-2 6 0 7 2 1-2 4-4 7-2 4 3 2 9-7 15z" fill="var(--color-brand-accent)" />
      <rect x="46" y="77" width="58" height="3" rx="1.5" fill="var(--color-brand-deep)" fillOpacity="0.18" />
    </svg>
  ),
  "pkg-post-partum-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="56" cy="32" r="9" fill="var(--color-brand-deep)" />
      <path d="M40 78c0-20 7-30 16-30s16 10 16 30z" fill="var(--color-brand-deep-2)" />
      <rect x="72" y="56" width="36" height="20" rx="10" fill="var(--surface, #fff)" stroke="var(--color-brand-deep)" strokeWidth="2.5" />
      <circle cx="100" cy="53" r="7" fill="var(--color-brand-accent)" />
      <path d="M62 62c6 8 14 10 22 8" stroke="var(--color-brand-deep-2)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M106 34c-6-4-7-8-5-10 2-1 4 0 5 2 1-2 3-3 5-2 3 2 1 6-5 10z" fill="var(--color-brand-accent)" />
    </svg>
  ),
  "pkg-post-surgery-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="68" cy="50" r="25" fill="var(--color-brand-deep)" />
      <rect x="62" y="35" width="12" height="30" rx="3" fill="var(--surface, #fff)" />
      <rect x="53" y="44" width="30" height="12" rx="3" fill="var(--surface, #fff)" />
      <path d="M94 76l22-20" stroke="var(--color-brand-accent)" strokeWidth="13" strokeLinecap="round" />
      <circle cx="102" cy="69" r="1.7" fill="var(--color-brand-deep-2)" />
      <circle cx="105" cy="66" r="1.7" fill="var(--color-brand-deep-2)" />
      <circle cx="108" cy="63" r="1.7" fill="var(--color-brand-deep-2)" />
    </svg>
  ),
  "pkg-live-in-package": (
    <svg {...commonProps}>
      {frame}
      <path d="M40 52L75 22l35 30z" fill="var(--color-brand-deep-2)" />
      <rect x="49" y="50" width="52" height="30" rx="3" fill="var(--color-brand-deep)" />
      <rect x="67" y="58" width="16" height="22" rx="2" fill="var(--surface, #fff)" />
      <path d="M75 45c-6-4-7-8-5-10 2-1 4 0 5 2 1-2 3-3 5-2 3 2 1 6-5 10z" fill="var(--color-brand-accent)" />
      <path d="M104 26a8 8 0 1 0 6 12 6.5 6.5 0 0 1-6-12z" fill="var(--color-brand-accent)" />
    </svg>
  ),
  palliative: (
    <svg {...commonProps}>
      {frame}
      <path d="M72 66c0-8 8-14 8-22 0-4-2-8-5-10-3 2-5 6-5 10 0 8 8 14 8 22z" fill="var(--color-brand-accent)" />
      <rect x="68" y="66" width="14" height="14" rx="5" fill="var(--color-brand-deep-2)" />
      <path d="M44 72c7 5 15 8 23 8M106 72c-7 5-15 8-23 8" stroke="var(--color-brand-deep)" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 52c5-5 11-5 15 0 4-5 10-5 15 0 0 8-8 12-15 18-7-6-15-10-15-18z" fill="var(--color-brand-mint)" />
    </svg>
  ),
};

const CategoryIllustration = ({ slug }) => {
  if (slug === "special-needs-care") {
    return (
      <img className="category-card__art-asset" src={disabledPersonIcon} alt="" />
    );
  }

  if (imageIllustrations[slug]) {
    return (
      <img
        className="category-card__art-asset"
        src={imageIllustrations[slug]}
        alt={imageAlt[slug] || "Category icon"}
      />
    );
  }

  return vectorIllustrations[slug] || null;
};

export default CategoryIllustration;
