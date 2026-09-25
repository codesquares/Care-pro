// Only these package categories are real, purchasable packages today (matches the
// backend's fixed Package.Category enum). Everything else below is still a general
// service area CarePro covers, but has no package behind it yet — filtering the
// marketplace to a slug with no real category would silently show "no packages
// found", so callers should fall back to the unfiltered catalog instead.
export const REAL_PACKAGE_CATEGORY_BY_SLUG = {
  "adult-care": "Adult/Elder Care",
  "post-surgery-care": "Post Surgery Care",
};

export const marketplaceLinkForCategorySlug = (slug) => {
  const realCategory = REAL_PACKAGE_CATEGORY_BY_SLUG[slug];
  return realCategory
    ? `/marketplace?category=${encodeURIComponent(realCategory)}`
    : "/marketplace";
};

export const categoryBrowseData = [
  {
    id: 1,
    slug: "adult-care",
    name: "Adult Care",
    description: "Compassionate care for seniors and adults",
    basePrice: 10000,
  },
  {
    id: 2,
    slug: "post-surgery-care",
    name: "Post Surgery Care",
    description: "Recovery support after surgery or hospital discharge",
    basePrice: 10000,
  },
  {
    id: 3,
    slug: "child-care",
    name: "Child Care",
    description: "Professional childcare and nanny services",
    basePrice: 10000,
  },
  {
    id: 4,
    slug: "pet-care",
    name: "Pet Care",
    description: "Pet minding, dog walking, and pet companionship",
    basePrice: 10000,
  },
  {
    id: 5,
    slug: "home-care",
    name: "Home Care",
    description: "General home assistance and daily living support",
    basePrice: 10000,
  },
  {
    id: 6,
    slug: "special-needs-care",
    name: "Special Needs Care",
    description: "Specialized care for individuals with special needs",
    basePrice: 10000,
  },
  {
    id: 7,
    slug: "medical-support",
    name: "Medical Support",
    description: "Nursing care and medical assistance",
    basePrice: 10000,
  },
  {
    id: 8,
    slug: "mobility-support",
    name: "Mobility Support",
    description: "Mobility assistance and fall prevention",
    basePrice: 10000,
  },
  {
    id: 9,
    slug: "therapy-wellness",
    name: "Therapy & Wellness",
    description: "Physical therapy and wellness support",
    basePrice: 10000,
  },
  {
    id: 10,
    slug: "palliative",
    name: "Palliative",
    description: "Palliative care and emotional support",
    basePrice: 10000,
  },
];

// Care-needs data stores category display names (e.g. "Adult Care"), not slugs —
// this resolves a name back to its slug so callers can reuse the same real-category
// check instead of re-deriving (and re-breaking) a slug by hand.
export const marketplaceLinkForCategoryName = (name) => {
  const match = categoryBrowseData.find((c) => c.name === name);
  return marketplaceLinkForCategorySlug(match?.slug);
};
