/**
 * Caregiver vetting lockout — pure logic (no React, no network), so it can be unit-tested.
 *
 * A caregiver is LOCKED when the lockout enforcement date (from /public-config) has been reached AND any of these is missing:
 *   - caregiver type set
 *   - two guarantors ADDED (list length >= 2, any status — confirmation is NOT required)
 *   - address history complete
 *   - police clearance SUBMITTED (pending or approved) — only once the SERVER says the clearance enforcement date has been
 *     reached (readiness.policeClearanceEnforced); the date is never hardcoded here. Approval is not required.
 * Fail OPEN everywhere: unknown/failed/unset => not locked. This is a workflow nudge, not a security boundary — the
 * server-side assignment gate is unchanged.
 */

export const VETTING_HUB_PATH = '/app/caregiver/vetting';
const BASE = '/app/caregiver';

// Open while locked (relative to /app/caregiver). A path is open when it equals an entry or is below it.
export const OPEN_WHILE_LOCKED = [
  '/vetting',                 // hub + every form/step (classification, guarantors, address-history, social-media, professional-profile, police-clearance)
  '/wallet', '/earnings', '/withdraw',
  '/settings',
  '/message',                 // Messages and /message/:recipientId
  '/notifications',
  '/verification', '/verification-callback', '/assessment',
  // These two only redirect to /assessment; they must not bounce to the hub first.
  '/specialized-assessment', '/specialized-assessments',
];

export const REQUIRED_GIVEN_GUARANTORS = 2;

const rel = (pathname) => {
  const p = String(pathname || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return p.startsWith(BASE) ? (p.slice(BASE.length) || '/') : p;
};

/** True when the caregiver may open `pathname` while locked. */
export const isPathOpenWhileLocked = (pathname) => {
  const r = rel(pathname);
  return OPEN_WHILE_LOCKED.some((open) => r === open || r.startsWith(`${open}/`));
};

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Whole days (rounded up) from now to the date; 0 when reached. */
export const daysUntil = (date, now = new Date()) => Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000));

/**
 * @param {object} i
 * @param {boolean} i.ready              all inputs loaded successfully
 * @param {string|null} i.enforcementDate  ISO from /public-config
 * @param {boolean} i.classificationSet
 * @param {number} i.guarantorCount
 * @param {boolean} i.addressComplete
 * @param {{status?:string, enforced?:boolean}|null} i.clearance  from readiness
 * @param {Date} [i.now]
 * @returns {{locked:boolean, noticeActive:boolean, enforcementDate:Date|null, daysLeft:number, missing:string[]}}
 */
export const computeLockState = ({
  ready, enforcementDate, classificationSet, guarantorCount, addressComplete, clearance, now = new Date(),
}) => {
  const date = toDate(enforcementDate);
  const none = { locked: false, noticeActive: false, enforcementDate: date, daysLeft: 0, missing: [] };
  if (!ready || !date) return none; // fail open / not enforced

  const missing = [];
  if (!classificationSet) missing.push('classification');
  if ((guarantorCount || 0) < REQUIRED_GIVEN_GUARANTORS) missing.push('guarantors');
  if (!addressComplete) missing.push('address-history');
  const submitted = clearance && (clearance.status === 'pending' || clearance.status === 'approved');
  if (clearance && clearance.enforced === true && !submitted) missing.push('police-clearance');

  const reached = now.getTime() >= date.getTime();
  return {
    locked: reached && missing.length > 0,
    noticeActive: !reached && missing.length > 0,
    enforcementDate: date,
    daysLeft: reached ? 0 : daysUntil(date, now),
    missing,
  };
};

/** Where to send the caregiver for a path, or null to let them through. */
export const lockRedirectFor = (pathname, lockState) =>
  lockState?.locked && !isPathOpenWhileLocked(pathname) ? VETTING_HUB_PATH : null;

export const MISSING_LABELS = {
  classification: 'Set your caregiver type',
  guarantors: 'Add two guarantors (they only need to be added — they can confirm later)',
  'address-history': 'Complete your address history',
  'police-clearance': 'Submit your police clearance (it only needs to be submitted — approval can come later)',
};
