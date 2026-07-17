const commonProps = {
  width: 150,
  height: 100,
  viewBox: "0 0 150 100",
  fill: "none",
};

const illustrations = {
  "adult-care": (
    <svg {...commonProps}>
      <path d="M35 90c-1-14 4-22 10-22s11 8 10 22" fill="#c8e6b8" />
      <circle cx="45" cy="56" r="11" fill="var(--color-skin)" />
      <path d="M35 53c1-6 5-9 10-9s9 3 10 9" stroke="var(--color-hair)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="93" y="46" width="26" height="38" rx="10" fill="var(--color-brand-deep-2)" />
      <circle cx="106" cy="34" r="11" fill="var(--color-skin)" />
      <path d="M96 31c3-9 8-13 11-13s8 4 11 13" stroke="var(--color-hair)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M93 58c-7 3-11 8-11 16" stroke="var(--color-brand-deep-2)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="72" cy="40" r="3" fill="var(--color-brand-accent)" opacity="0.6" />
    </svg>
  ),
  "post-surgery-care": (
    <svg {...commonProps}>
      <rect x="30" y="55" width="70" height="28" rx="8" fill="var(--color-brand-mint)" />
      <rect x="30" y="48" width="70" height="10" rx="5" fill="var(--color-brand-deep)" />
      <circle cx="48" cy="48" r="10" fill="var(--color-skin)" />
      <rect x="30" y="65" width="70" height="6" fill="#fff" />
      <path d="M112 40c8 0 14 6 14 14s-6 14-14 14" stroke="var(--color-brand-deep-2)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M108 30l4 8 4-8" stroke="var(--color-brand-accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 90h74" stroke="var(--color-brand-deep)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  "child-care": (
    <svg {...commonProps}>
      <circle cx="55" cy="45" r="14" fill="var(--color-skin)" />
      <path d="M42 40c2-8 7-11 13-11s11 3 13 11" stroke="var(--color-hair)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="38" y="60" width="34" height="30" rx="12" fill="var(--color-brand-accent)" />
      <circle cx="105" cy="62" r="9" fill="var(--color-skin)" />
      <path d="M97 58c1-5 4-7 8-7s7 2 8 7" stroke="var(--color-hair)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="93" y="71" width="24" height="20" rx="9" fill="var(--color-brand-deep-2)" />
      <circle cx="100" cy="50" r="5" fill="var(--color-brand-mint)" />
    </svg>
  ),
  "pet-care": (
    <svg {...commonProps}>
      <rect x="35" y="45" width="30" height="42" rx="12" fill="var(--color-brand-deep-2)" />
      <circle cx="50" cy="34" r="12" fill="var(--color-skin)" />
      <path d="M39 30c2-7 6-10 11-10s9 3 11 10" stroke="var(--color-hair)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M65 70c15-2 25-6 30-14" stroke="var(--color-brand-deep)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="112" cy="66" rx="16" ry="10" fill="var(--color-brand-deep)" />
      <circle cx="123" cy="58" r="6" fill="var(--color-brand-deep)" />
      <path d="M100 66c-2-3-2-6 0-8" stroke="var(--color-brand-deep)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  ),
  "home-care": (
    <svg {...commonProps}>
      <path d="M55 30l-30 24v34h60V54z" fill="var(--color-brand-deep)" />
      <rect x="70" y="66" width="14" height="22" fill="var(--color-brand-mint)" />
      <rect x="35" y="58" width="14" height="12" fill="var(--color-brand-mint)" />
      <path d="M20 54l35-28 35 28" stroke="var(--color-brand-deep)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M110 50c8 3 13 10 13 18" stroke="var(--color-brand-accent)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="112" cy="42" r="8" fill="var(--color-skin)" />
    </svg>
  ),
  "special-needs-care": (
    <svg {...commonProps}>
      <path d="M75 32c8-10 24-10 28 2 4 10-6 20-28 34-22-14-32-24-28-34 4-12 20-12 28-2z" fill="var(--color-brand-accent)" opacity="0.85" />
      <circle cx="40" cy="72" r="10" fill="var(--color-skin)" />
      <rect x="28" y="82" width="24" height="16" rx="8" fill="var(--color-brand-deep-2)" />
      <circle cx="110" cy="72" r="10" fill="var(--color-skin)" />
      <rect x="98" y="82" width="24" height="16" rx="8" fill="var(--color-brand-deep)" />
    </svg>
  ),
  "medical-support": (
    <svg {...commonProps}>
      <rect x="55" y="35" width="40" height="26" rx="6" fill="#fff" stroke="var(--color-brand-deep)" strokeWidth="3" />
      <rect x="65" y="42" width="8" height="8" fill="var(--color-brand-accent)" />
      <rect x="77" y="42" width="8" height="8" fill="var(--color-brand-deep-2)" />
      <circle cx="45" cy="70" r="11" fill="var(--color-skin)" />
      <rect x="32" y="82" width="26" height="16" rx="8" fill="var(--color-brand-deep-2)" />
      <path d="M100 68c0-8 6-14 14-14s14 6 14 14-6 14-14 14" stroke="var(--color-brand-deep)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M114 60v10l7 4" stroke="var(--color-brand-accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "mobility-support": (
    <svg {...commonProps}>
      <circle cx="50" cy="45" r="11" fill="var(--color-skin)" />
      <rect x="36" y="60" width="28" height="30" rx="12" fill="var(--color-brand-deep-2)" />
      <path d="M36 90l-6 6M64 90l6 6" stroke="var(--color-brand-deep)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="30" cy="96" r="4" fill="none" stroke="var(--color-brand-deep)" strokeWidth="3" />
      <path d="M85 40v50M85 40l14 8M85 40l-14 8" stroke="var(--color-brand-accent)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M75 90h20" stroke="var(--color-brand-deep)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  "therapy-wellness": (
    <svg {...commonProps}>
      <circle cx="75" cy="38" r="12" fill="var(--color-skin)" />
      <path d="M63 34c2-8 6-11 12-11s10 3 12 11" stroke="var(--color-hair)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M75 52c-14 0-22 10-18 26M75 52c14 0 22 10 18 26" stroke="var(--color-brand-deep-2)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M75 52v34" stroke="var(--color-brand-deep-2)" strokeWidth="8" strokeLinecap="round" />
      <path d="M35 30q6-8 12 0" stroke="var(--color-brand-mint)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M103 30q6-8 12 0" stroke="var(--color-brand-mint)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  ),
  palliative: (
    <svg {...commonProps}>
      <circle cx="58" cy="50" r="10" fill="var(--color-skin)" />
      <rect x="46" y="63" width="24" height="26" rx="10" fill="var(--color-brand-deep-2)" />
      <circle cx="92" cy="50" r="10" fill="var(--color-skin)" />
      <rect x="80" y="63" width="24" height="26" rx="10" fill="var(--color-brand-deep)" />
      <path d="M66 74h18" stroke="var(--color-brand-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M75 30c4-6 12-6 14 1 2 5-3 10-14 17-11-7-16-12-14-17 2-7 10-7 14-1z" fill="var(--color-brand-accent)" opacity="0.85" />
    </svg>
  ),
};

const CategoryIllustration = ({ slug }) => {
  return illustrations[slug] || illustrations["adult-care"];
};

export default CategoryIllustration;
