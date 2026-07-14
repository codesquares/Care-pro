export const UI_ERROR_CODES = {
  COMMITMENT_REQUIRED_FOR_CHAT: 'COMMITMENT_REQUIRED_FOR_CHAT',
  COMMITMENT_REQUIRED_FOR_CHECKOUT: 'COMMITMENT_REQUIRED_FOR_CHECKOUT',
  REFERRAL_RECURRING_ONLY: 'REFERRAL_RECURRING_ONLY',
  REFERRAL_INVALID_OR_INACTIVE: 'REFERRAL_INVALID_OR_INACTIVE',
  REFERRAL_SELF_NOT_ALLOWED: 'REFERRAL_SELF_NOT_ALLOWED',
  REFERRAL_ALREADY_USED_BY_CLIENT: 'REFERRAL_ALREADY_USED_BY_CLIENT',
  REFERRAL_PAYABLE_NON_POSITIVE: 'REFERRAL_PAYABLE_NON_POSITIVE',
  CHECKOUT_DUPLICATE_ACTIVE_ORDER: 'CHECKOUT_DUPLICATE_ACTIVE_ORDER',
  CHECKOUT_REPURCHASE_RECURRING_BLOCKED: 'CHECKOUT_REPURCHASE_RECURRING_BLOCKED',
  CHAT_CONTACT_POLICY_BLOCK: 'CHAT_CONTACT_POLICY_BLOCK',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
};

export const extractApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (data?.errorMessage) return data.errorMessage;
  if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors.join(', ');
  if (data?.errors && typeof data.errors === 'object') {
    const firstFieldErrors = Object.values(data.errors).find((v) => Array.isArray(v) && v.length > 0);
    if (firstFieldErrors) return firstFieldErrors.join(', ');
  }

  return error?.message || fallback;
};

export const mapUiErrorCode = ({ message = '', status } = {}) => {
  const msg = String(message || '');
  const lower = msg.toLowerCase();

  if (status === 401) return UI_ERROR_CODES.AUTH_REQUIRED;
  if (status === 403) return UI_ERROR_CODES.FORBIDDEN;
  if (status === 404) return UI_ERROR_CODES.NOT_FOUND;
  if (status === 500) return UI_ERROR_CODES.SERVER_ERROR;

  if (lower.includes('before messaging this caregiver')) return UI_ERROR_CODES.COMMITMENT_REQUIRED_FOR_CHAT;
  if (lower.includes('before purchasing this gig')) return UI_ERROR_CODES.COMMITMENT_REQUIRED_FOR_CHECKOUT;

  if (msg === 'Referral codes can only be used on recurring services.') return UI_ERROR_CODES.REFERRAL_RECURRING_ONLY;
  if (msg === 'Invalid or inactive referral code.') return UI_ERROR_CODES.REFERRAL_INVALID_OR_INACTIVE;
  if (msg === 'Self-referral is not allowed.') return UI_ERROR_CODES.REFERRAL_SELF_NOT_ALLOWED;
  if (msg === 'This client has already used a referral and cannot use another code.') return UI_ERROR_CODES.REFERRAL_ALREADY_USED_BY_CLIENT;

  if (lower.includes('payable amount') && lower.includes('zero or negative')) {
    return UI_ERROR_CODES.REFERRAL_PAYABLE_NON_POSITIVE;
  }

  if (msg.startsWith('You already have an active order for this gig.')) {
    return UI_ERROR_CODES.CHECKOUT_DUPLICATE_ACTIVE_ORDER;
  }

  if (msg.startsWith('You have already purchased this gig on a recurring plan.')) {
    return UI_ERROR_CODES.CHECKOUT_REPURCHASE_RECURRING_BLOCKED;
  }

  if (
    status === 400 &&
    (lower.includes('contact information') || lower.includes('sharing personal contact'))
  ) {
    return UI_ERROR_CODES.CHAT_CONTACT_POLICY_BLOCK;
  }

  if (status === 400) return UI_ERROR_CODES.VALIDATION_ERROR;
  return UI_ERROR_CODES.UNKNOWN;
};

export const parseApiError = (error, fallback = 'Something went wrong.') => {
  const message = extractApiErrorMessage(error, fallback);
  const status = error?.response?.status;
  const uiErrorCode = mapUiErrorCode({ message, status });
  return { message, status, uiErrorCode };
};
