// PROVISIONAL RULE (owner has not confirmed it): a caregiver's Professional Profile counts as "done" when they
// have added at least ONE education, certification or work entry. Kept in this single function so it is easy to change.
//
// DISPLAY ONLY. This drives the Vetting Hub card state and nothing else. It must NOT feed any lockout logic —
// the lockout (utils/vettingLockout.js) deliberately does not look at profile completeness.
export const isProfessionalProfileDone = (counts) => {
  if (!counts) return false;
  return (counts.education || 0) + (counts.certifications || 0) + (counts.work || 0) > 0;
};
