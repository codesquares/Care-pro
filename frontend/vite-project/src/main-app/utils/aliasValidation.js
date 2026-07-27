/**
 * Shared referrer-alias validation, used by the admin create-referrer form
 * and the public "become a referrer" apply page so both surfaces enforce the
 * exact same rule the backend enforces (ReferralService.TryNormalizeAlias):
 * trimmed length 3-20, letters and digits only.
 */

export const ALIAS_REGEX = /^[a-zA-Z0-9]{3,20}$/;

/**
 * @param {string} alias
 * @returns {string|null} An error message matching the backend's own wording, or null if valid.
 */
export const getAliasError = (alias) => {
  const trimmed = (alias || '').trim();

  if (!trimmed) {
    return 'Alias is required.';
  }

  if (!ALIAS_REGEX.test(trimmed)) {
    return 'Alias must be 3-20 alphanumeric characters (letters and numbers only).';
  }

  return null;
};
