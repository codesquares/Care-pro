/**
 * Dojah Verification Gate Service
 *
 * Wraps the two server-side gate endpoints introduced to control Dojah
 * widget cost and to add Client verification support:
 *   - GET  /Dojah/eligibility       (read-only UI state)
 *   - POST /Dojah/initiate-session  (issues server-signed referenceId)
 *
 * The gate response uses these reason codes (lowercase):
 *   eligible | already_verified | pending_review | cooldown_active | max_attempts_reached
 */

import api from './api';

/**
 * @typedef {Object} VerificationGate
 * @property {boolean} isEligible
 * @property {('eligible'|'already_verified'|'pending_review'|'cooldown_active'|'max_attempts_reached')} reason
 * @property {number} attemptCount
 * @property {number} attemptsRemaining
 * @property {string|null} cooldownUntil  ISO UTC datetime when reason === 'cooldown_active'
 */

/**
 * @typedef {Object} VerificationSession
 * @property {string} referenceId
 * @property {string} userId
 * @property {('Caregiver'|'Client')} userType
 * @property {string} issuedAt
 * @property {string} expiresAt
 * @property {number} attemptCount
 * @property {number} attemptsRemaining
 */

/**
 * Fetch the current verification eligibility for the authenticated user.
 * Always returns the gate object — backend always responds 200, even when blocked.
 *
 * @returns {Promise<VerificationGate>}
 */
export async function getEligibility() {
  const response = await api.get('/Dojah/eligibility');
  return response.data;
}

/**
 * Request a server-signed Dojah session. Call this immediately before
 * opening the widget. Increments the attempt counter atomically.
 *
 * On success (200): returns { gate, session }.
 * On blocked (403): rejects with err.response.data === gate (a VerificationGate).
 *
 * @returns {Promise<{ gate: VerificationGate, session: VerificationSession }>}
 */
export async function initiateSession() {
  const response = await api.post('/Dojah/initiate-session');
  return response.data;
}

const dojahGateService = { getEligibility, initiateSession };
export default dojahGateService;
