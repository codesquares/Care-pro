/**
 * Shared password-strength helper used by the register and forgot-password
 * flows so both surfaces give users the same Weak / Medium / Strong feedback.
 *
 * Scoring (max 6):
 *   +1 length >= 8
 *   +1 length >= 12
 *   +1 lowercase letter
 *   +1 uppercase letter
 *   +1 digit
 *   +1 symbol (non-alphanumeric)
 *
 * Buckets:
 *   score < 3        -> Weak
 *   3 <= score < 5   -> Medium
 *   score >= 5       -> Strong
 */

/**
 * @typedef {Object} PasswordStrength
 * @property {number} score        Raw score, 0..6
 * @property {"Weak"|"Medium"|"Strong"} label
 * @property {string} color        Hex colour suitable for bar/text
 * @property {number} percent      Bar width, 0..100
 * @property {string[]} suggestions Human-readable hints on how to make it stronger
 */

/**
 * @param {string} password
 * @returns {PasswordStrength}
 */
export const getPasswordStrength = (password = "") => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let label = "Strong";
  let color = "#66bb6a";
  let percent = 100;
  if (score < 3) {
    label = "Weak";
    color = "#f85c70";
    percent = 33;
  } else if (score < 5) {
    label = "Medium";
    color = "#ffa726";
    percent = 66;
  }

  const suggestions = [];
  if (password.length < 8) suggestions.push("at least 8 characters");
  else if (password.length < 12) suggestions.push("12+ characters for a stronger password");
  if (!/[a-z]/.test(password)) suggestions.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) suggestions.push("an uppercase letter");
  if (!/[0-9]/.test(password)) suggestions.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) suggestions.push("a symbol (e.g. !@#$)");

  return { score, label, color, percent, suggestions };
};

export default getPasswordStrength;
