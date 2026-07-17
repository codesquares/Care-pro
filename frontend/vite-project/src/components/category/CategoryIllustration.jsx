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

const illustrations = {
  // Reference mapping: Old -> Adult Care
  "adult-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="52" cy="34" r="9" fill="var(--color-skin)" />
      <path d="M44 31c1-5 4-7 8-7s7 2 8 7" stroke="var(--color-hair)" strokeWidth="3" strokeLinecap="round" />
      <rect x="42" y="44" width="20" height="24" rx="9" fill="var(--color-brand-deep-2)" />
      <path d="M88 32v38" stroke="var(--color-brand-deep)" strokeWidth="5" strokeLinecap="round" />
      <path d="M88 51h14" stroke="var(--color-brand-accent)" strokeWidth="5" strokeLinecap="round" />
      <path d="M88 70h16" stroke="var(--color-brand-deep)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  ),
  // Reference mapping: Stethoscope -> Post Surgery Care
  "post-surgery-care": (
    <svg {...commonProps}>
      {frame}
      <path d="M48 36c0 10 8 18 18 18s18-8 18-18" stroke="var(--color-brand-deep-2)" strokeWidth="5" strokeLinecap="round" />
      <path d="M84 36c0 10 8 18 18 18" stroke="var(--color-brand-deep-2)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="102" cy="54" r="7" fill="none" stroke="var(--color-brand-deep)" strokeWidth="4" />
      <rect x="56" y="28" width="20" height="14" rx="5" fill="var(--surface)" stroke="var(--color-brand-deep)" strokeWidth="3" />
      <path d="M66 31v8M62 35h8" stroke="var(--color-brand-accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  // Reference mapping: Baby_boy -> Child Care
  "child-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="58" cy="38" r="12" fill="var(--color-skin)" />
      <path d="M47 34c2-7 6-10 11-10s9 3 11 10" stroke="var(--color-hair)" strokeWidth="3" strokeLinecap="round" />
      <rect x="44" y="52" width="28" height="24" rx="11" fill="var(--color-brand-deep-2)" />
      <circle cx="94" cy="53" r="8" fill="var(--color-brand-accent)" />
      <path d="M94 45v16M86 53h16" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="106" cy="65" r="6" fill="var(--color-brand-mint)" />
    </svg>
  ),
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
  // Reference mapping: Home -> Home Care
  "home-care": (
    <svg {...commonProps}>
      {frame}
      <path d="M34 52l25-20 25 20v28H34z" fill="var(--color-brand-deep)" />
      <path d="M31 52l28-22 28 22" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="54" y="64" width="10" height="16" rx="3" fill="var(--color-brand-mint)" />
      <rect x="41" y="59" width="9" height="8" rx="2" fill="var(--color-brand-mint)" />
      <path d="M96 60l10-10 10 10" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M106 50v18" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  // Reference mapping: Disabled_person + Blind -> Special Needs Care
  "special-needs-care": (
    <svg {...commonProps}>
      {frame}
      <circle cx="52" cy="33" r="8" fill="var(--color-skin)" />
      <path d="M52 42v14M52 49h13" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="75" cy="68" r="14" fill="none" stroke="var(--color-brand-deep)" strokeWidth="4" />
      <path d="M75 68l13 8" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M97 34q10 0 14 6" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" />
      <path d="M97 44q10 0 14-6" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" />
      <path d="M95 39h20" stroke="var(--color-brand-accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  // Reference mapping: Pharmacy -> Medical Support
  "medical-support": (
    <svg {...commonProps}>
      {frame}
      <rect x="36" y="30" width="56" height="44" rx="10" fill="var(--surface)" stroke="var(--color-brand-deep)" strokeWidth="3" />
      <path d="M56 38v28M44 52h24" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      <rect x="96" y="34" width="24" height="10" rx="5" fill="var(--color-brand-deep-2)" />
      <rect x="96" y="50" width="24" height="10" rx="5" fill="var(--color-brand-accent)" />
    </svg>
  ),
  // Reference mapping: Wheelchair -> Mobility Support
  "mobility-support": (
    <svg {...commonProps}>
      {frame}
      <circle cx="53" cy="33" r="8" fill="var(--color-skin)" />
      <path d="M53 42v14M53 49h12" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="82" cy="66" r="14" fill="none" stroke="var(--color-brand-deep)" strokeWidth="4" />
      <path d="M62 58h17l8 13" stroke="var(--color-brand-deep-2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="110" cy="70" r="6" fill="var(--color-brand-accent)" />
    </svg>
  ),
  // Reference mapping: Meditation -> Therapy & Wellness
  "therapy-wellness": (
    <svg {...commonProps}>
      {frame}
      <circle cx="75" cy="33" r="8" fill="var(--color-skin)" />
      <path d="M67 30c1-5 4-7 8-7s7 2 8 7" stroke="var(--color-hair)" strokeWidth="3" strokeLinecap="round" />
      <path d="M75 44c-12 0-18 9-16 20M75 44c12 0 18 9 16 20" stroke="var(--color-brand-deep-2)" strokeWidth="5" strokeLinecap="round" />
      <path d="M59 70h32" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M47 54q8 8 16 0M87 54q8 8 16 0" stroke="var(--color-brand-mint)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  // New 10th icon for Palliative
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
  return illustrations[slug] || illustrations["adult-care"];
};

export default CategoryIllustration;
