/**
 * Admin authorization policies — mirrors the backend AddAuthorization() policies.
 *
 * Policies:
 *   superAdmin          → Role === 'SuperAdmin'
 *   operations          → SuperAdmin  OR  Admin with dept in [HR, ComplianceAndLegal, CareLeads]
 *   finance             → SuperAdmin  OR  Admin with dept === 'Finance'
 *   analytics           → SuperAdmin  OR  Admin with dept === 'MarketingAndSales'
 *   financeOrOperations → finance  OR  operations
 */

export const OPERATIONS_DEPARTMENTS = ['HR', 'ComplianceAndLegal', 'CareLeads'];
export const FINANCE_DEPARTMENT     = 'Finance';
export const ANALYTICS_DEPARTMENT   = 'MarketingAndSales';

/**
 * Check whether a user satisfies a named policy.
 *
 * @param {string} policy  - 'superAdmin' | 'operations' | 'finance' | 'analytics' | 'financeOrOperations'
 * @param {string} role    - 'SuperAdmin' | 'Admin' | ...
 * @param {string} [dept]  - department string (may be undefined/null for SuperAdmins)
 * @returns {boolean}
 */
export const hasPolicy = (policy, role, dept) => {
  if (!policy) return true;                    // no restriction → all authenticated admins
  if (role === 'SuperAdmin') return true;      // SuperAdmin always passes
  if (role !== 'Admin') return false;          // only Admin role beyond this point

  switch (policy) {
    case 'superAdmin':
      return false;
    case 'operations':
      return OPERATIONS_DEPARTMENTS.includes(dept);
    case 'finance':
      return dept === FINANCE_DEPARTMENT;
    case 'analytics':
      return dept === ANALYTICS_DEPARTMENT;
    case 'financeOrOperations':
      return dept === FINANCE_DEPARTMENT || OPERATIONS_DEPARTMENTS.includes(dept);
    default:
      return true;
  }
};

/** Convenience: check if user is SuperAdmin */
export const isSuperAdmin = (role) => role === 'SuperAdmin';

/**
 * Return a human-readable label for a department string.
 */
export const deptLabel = (dept) => {
  const MAP = {
    HR:                 'HR',
    ComplianceAndLegal: 'Compliance & Legal',
    CareLeads:          'Care Leads',
    Finance:            'Finance',
    MarketingAndSales:  'Marketing & Sales',
  };
  return MAP[dept] || dept || '—';
};
