/**
 * Caregiver proof of CURRENT address: a recent power-holding (NEPA) / electricity bill, reviewed by staff.
 * Consumes /api/caregiver/vetting/address-history/{addressId}/proof (Authorize(Roles = "Caregiver") on the backend).
 * The caregiver id is always derived from the JWT server-side — it is never sent from here.
 * The proof state itself arrives on each address record from GET /address-history as `proof`:
 *   { required, status: 'none'|'pending'|'approved'|'rejected', billDate, nameOnBill, submittedAt, reviewedAt,
 *     rejectionReason, canSubmit, maxBillAgeMonths, maxFileSizeMB }
 */
import api from './api';
import { VETTING_DATA_CHANGED_EVENT } from './caregiverVettingService';

const base = (addressId) => `/caregiver/vetting/address-history/${addressId}/proof`;

export const BILL_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (error?.response?.status === 413) return 'That file is too large. Please keep it within 10 MB.';
  return data?.message || error?.message || fallback;
};

/** Friendly client-side pre-check that mirrors the server rules (the server stays the authority). Returns a message or null. */
export const validateBillFile = (file) => {
  if (!file) return 'Please attach your power-holding (NEPA) bill as a PDF, JPG or PNG.';
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" isn't a PDF, JPG or PNG.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" is larger than 10 MB.`;
  return null;
};

const addressProofService = {
  /** POST multipart: billDate (yyyy-mm-dd), nameOnBill, file. Returns the record's updated proof info. */
  async submit(addressId, { billDate, nameOnBill, file }) {
    try {
      const form = new FormData();
      form.append('billDate', billDate);
      form.append('nameOnBill', nameOnBill);
      form.append('file', file, file.name);
      const response = await api.post(base(addressId), form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(VETTING_DATA_CHANGED_EVENT)); // lockout re-evaluates
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error submitting address proof:', error);
      return { success: false, error: extractError(error, 'We could not submit your bill. Please try again.') };
    }
  },

  /** GET the caller's own bill as a Blob (sent with the auth header — there is no public URL). */
  async fetchFile(addressId) {
    try {
      const response = await api.get(`${base(addressId)}/file`, { responseType: 'blob', timeout: 60000 });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Could not open this file') };
    }
  },
};

export default addressProofService;
