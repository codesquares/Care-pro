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
  "home-care": "Home care icon",
  "medical-support": "Medical support icon",
  "mobility-support": "Mobility support icon",
  "therapy-wellness": "Therapy and wellness icon",
};

const imageIllustrations = {
  "adult-care": oldIcon,
  "post-surgery-care": stethoscopeIcon,
  "child-care": babyBoyIcon,
  "home-care": homeIcon,
  "medical-support": pharmacyIcon,
  "mobility-support": wheelchairIcon,
  "therapy-wellness": meditationIcon,
};

const vectorIllustrations = {
  "pet-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="46" cy="40" r="8" fill="var(--color-brand-accent)" />
      <circle cx="64" cy="40" r="8" fill="var(--color-brand-accent)" />
      <circle cx="40" cy="56" r="8" fill="var(--color-brand-accent)" />
      <circle cx="70" cy="56" r="8" fill="var(--color-brand-accent)" />
      <path d="M56 44c9 0 16 8 16 17 0 7-6 13-16 13s-16-6-16-13c0-9 7-17 16-17z" fill="var(--color-brand-deep-2)" />
      <circle cx="102" cy="34" r="9" fill="var(--color-skin)" />
      <path d="M94 31c1-5 4-7 8-7s7 2 8 7" stroke="var(--color-hair)" strokeWidth="3" strokeLinecap="round" />
      <path d="M95 60c9-2 17-8 20-14" stroke="var(--color-brand-deep)" strokeWidth="4" strokeLinecap="round" />
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
      <div className="category-card__art-asset-group" role="presentation" aria-hidden="true">
        <img className="category-card__art-asset" src={disabledPersonIcon} alt="" />
        <img className="category-card__art-asset category-card__art-asset--offset" src={blindIcon} alt="" />
      </div>
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

  return vectorIllustrations[slug] || vectorIllustrations["pet-care"];
};

export default CategoryIllustration;
