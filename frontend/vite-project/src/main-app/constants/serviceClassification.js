/**
 * Service Classification System
 * 
 * Defines which services are GENERAL (open to all verified caregivers)
 * vs SPECIALIZED (require additional assessments + certificates).
 * 
 * TIER 1 (General): Identity verification + SSCE certificate + general assessment (70%)
 * TIER 2 (Specialized): All TIER 1 requirements + specialized assessment + specialized certificate(s)
 */

// ─── Tier Definitions ────────────────────────────────────────────────────────

export const SERVICE_TIERS = {
  GENERAL: 'general',
  SPECIALIZED: 'specialized',
};

// ─── Category Tier Map ───────────────────────────────────────────────────────

export const CATEGORY_TIER_MAP = {
  'Adult Care':        SERVICE_TIERS.GENERAL,
  'Child Care':        SERVICE_TIERS.GENERAL,
  'Pet Care':          SERVICE_TIERS.GENERAL,
  'Home Care':         SERVICE_TIERS.GENERAL,
  'Mobility Support':  SERVICE_TIERS.GENERAL,
  'Medical Support':   SERVICE_TIERS.SPECIALIZED,
  'Post Surgery Care': SERVICE_TIERS.SPECIALIZED,
  'Special Needs Care':SERVICE_TIERS.SPECIALIZED,
  'Palliative':        SERVICE_TIERS.SPECIALIZED,
  'Therapy & Wellness':SERVICE_TIERS.SPECIALIZED,
};

// ─── Subcategory Classification ──────────────────────────────────────────────
// Some GENERAL categories have individual subcategories that are specialized.
// These subcategories are locked unless the caregiver has completed the
// relevant specialized assessment + certificates.

export const SPECIALIZED_SUBCATEGORIES = {
  'Adult Care': [
    'Chronic illness management',
    'Incontinence care',
  ],
  'Medical Support': [
    'Nursing care',
    'Medication reminders',
    'Medical appointment coordination',
    'Palliative care support',
    'Chronic illness management',
  ],
  'Mobility Support': [
    'Assistive device training',
  ],
};

// ─── Requirements per Specialized Category ───────────────────────────────────

export const SPECIALIZED_REQUIREMENTS = {
  'Medical Support': {
    label: 'Medical Support',
    assessmentCategory: 'MedicalSupport',
    requiredCertificates: ['Nursing License', 'CPR Certification'],
    description: 'Requires a nursing or healthcare qualification and CPR certification.',
  },
  'Post Surgery Care': {
    label: 'Post Surgery Care',
    assessmentCategory: 'PostSurgeryCare',
    requiredCertificates: ['Nursing License', 'First Aid Training Certificate'],
    description: 'Requires nursing/healthcare background and first aid certification.',
  },
  'Special Needs Care': {
    label: 'Special Needs Care',
    assessmentCategory: 'SpecialNeedsCare',
    requiredCertificates: ['Special Needs Training Certificate'],
    description: 'Requires a recognized special needs training certificate.',
  },
  'Palliative': {
    label: 'Palliative Care',
    assessmentCategory: 'PalliativeCare',
    requiredCertificates: ['Palliative Care Training Certificate'],
    description: 'Requires palliative or end-of-life care training.',
  },
  'Therapy & Wellness': {
    label: 'Therapy & Wellness',
    assessmentCategory: 'TherapyAndWellness',
    requiredCertificates: ['Physical Therapy Assistant Certificate'],
    description: 'Requires therapy or rehabilitation support training.',
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check if a service category is specialized (TIER 2)
 */
export const isSpecializedCategory = (category) => {
  return CATEGORY_TIER_MAP[category] === SERVICE_TIERS.SPECIALIZED;
};

/**
 * Check if a specific subcategory is specialized within a general category
 */
export const isSpecializedSubcategory = (category, subcategory) => {
  // All subcategories of a specialized category are specialized
  if (isSpecializedCategory(category)) return true;
  // Some general categories have individual specialized subcategories
  const specializedSubs = SPECIALIZED_SUBCATEGORIES[category];
  return specializedSubs ? specializedSubs.includes(subcategory) : false;
};

/**
 * Get the requirements for a specialized service category
 */
export const getSpecializedRequirements = (category) => {
  return SPECIALIZED_REQUIREMENTS[category] || null;
};

/**
 * Get which specialized category a locked subcategory belongs to.
 * For specialized subcategories within a general category (e.g. "Chronic illness management"
 * inside "Adult Care"), this returns the specialized category whose assessment covers it.
 */
export const getRequiredSpecializationForSubcategory = (category, subcategory) => {
  if (isSpecializedCategory(category)) {
    return SPECIALIZED_REQUIREMENTS[category] || null;
  }
  // Map general-category specialized subcategories to their governing specialization
  const SUBCATEGORY_TO_SPECIALIZATION = {
    'Chronic illness management': 'Medical Support',
    'Incontinence care': 'Medical Support',
    'Assistive device training': 'Therapy & Wellness',
  };
  const specializationKey = SUBCATEGORY_TO_SPECIALIZATION[subcategory];
  return specializationKey ? SPECIALIZED_REQUIREMENTS[specializationKey] : null;
};

/**
 * Filter subcategories: returns { available: [...], locked: [...] }
 * based on the caregiver's specialization status.
 * 
 * @param {string} category  - The gig category
 * @param {string[]} allSubcategories - All subcategories for that category
 * @param {Object} caregiverSpecializations - Map of specialization keys to { isQualified: bool }
 */
export const filterSubcategoriesByEligibility = (category, allSubcategories, caregiverSpecializations = {}) => {
  // For a fully specialized category, check the top-level specialization
  if (isSpecializedCategory(category)) {
    const req = SPECIALIZED_REQUIREMENTS[category];
    const spec = req ? caregiverSpecializations[req.assessmentCategory] : null;
    if (spec?.isQualified) {
      return { available: allSubcategories, locked: [] };
    }
    return { available: [], locked: allSubcategories };
  }

  // For general categories with mixed subcategories
  const available = [];
  const locked = [];

  allSubcategories.forEach((sub) => {
    if (isSpecializedSubcategory(category, sub)) {
      // Check if caregiver has the required specialization
      const reqSpec = getRequiredSpecializationForSubcategory(category, sub);
      const specStatus = reqSpec ? caregiverSpecializations[reqSpec.assessmentCategory] : null;
      if (specStatus?.isQualified) {
        available.push(sub);
      } else {
        locked.push(sub);
      }
    } else {
      available.push(sub);
    }
  });

  return { available, locked };
};

/**
 * Get a list of all service categories with their tier info for display
 */
export const getAllCategoriesWithTiers = () => {
  return Object.entries(CATEGORY_TIER_MAP).map(([category, tier]) => ({
    category,
    tier,
    isSpecialized: tier === SERVICE_TIERS.SPECIALIZED,
    requirements: SPECIALIZED_REQUIREMENTS[category] || null,
  }));
};

// ─── Backend Service Category Key Mapping ────────────────────────────────────
// Maps the UI display name ↔ backend `serviceCategory` snake_case key.
// The backend uses these keys in all assessment/eligibility/requirements endpoints.

export const CATEGORY_TO_SERVICE_KEY = {
  'Adult Care':         'AdultCare',
  'Child Care':         'ChildCare',
  'Pet Care':           'PetCare',
  'Home Care':          'HomeCare',
  'Mobility Support':   'MobilitySupport',
  'Medical Support':    'MedicalSupport',
  'Post Surgery Care':  'PostSurgeryCare',
  'Special Needs Care': 'SpecialNeedsCare',
  'Palliative':         'PalliativeCare',
  'Therapy & Wellness': 'TherapyAndWellness',
};

// Reverse map: backend key → display name
export const SERVICE_KEY_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_SERVICE_KEY).map(([k, v]) => [v, k])
);

/**
 * Convert a UI category display name to the backend serviceCategory key.
 * Falls back to snake_case conversion if not in the map.
 */
export const toServiceKey = (displayName) => {
  return CATEGORY_TO_SERVICE_KEY[displayName]
    || displayName.replace(/[&]/g, 'And').replace(/\s+/g, '');
};

/**
 * Convert a backend serviceCategory key to the UI display name.
 */
export const toDisplayName = (serviceKey) => {
  return SERVICE_KEY_TO_CATEGORY[serviceKey] || serviceKey;
};

// ─── Expanded Certificate Types ──────────────────────────────────────────────
// Full list of accepted certificate types with their categories.

export const SPECIALIZED_CERTIFICATE_TYPES = [
  { name: "Bachelor's Degree In Nursing",          category: 'educational' },
  { name: "Master's Degree In Nursing",            category: 'educational' },
  { name: 'Diploma In Nursing',                    category: 'educational' },
  { name: 'Certificate In Nursing',                category: 'educational' },
  { name: 'Nursing License',                       category: 'professional' },
  { name: 'CPR Certification',                     category: 'medical' },
  { name: 'First Aid Certification',               category: 'medical' },
  { name: 'Basic Life Support (BLS)',               category: 'medical' },
  { name: 'Special Needs Training',                category: 'specialized' },
  { name: 'Dementia Care Certification',           category: 'specialized' },
  { name: 'Medication Administration Certification', category: 'specialized' },
  { name: 'Palliative Care Training',               category: 'specialized' },
  { name: 'Physical Therapy Assistant Certification', category: 'specialized' },
  { name: 'Home Health Aide Certification',          category: 'specialized' },
];
