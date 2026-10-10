/**
 * Caregiver police clearance (vetting step).
 * Consumes /api/caregiver/vetting/police-clearance (Authorize(Roles = "Caregiver") on the backend).
 * The caregiver id is always derived from the JWT server-side — it is never sent from here.
 *
 * Status shape (GET): { status: 'none'|'pending'|'approved'|'rejected'|'revoked', clearanceId, issueDate, submittedAt,
 *   reviewedAt, nameOnDocument, referenceNumber, rejectionReason, revokedReason, canResubmit, maxAgeMonths, enforced,
 *   enforcementDate, files: [{index,fileName,contentType,sizeBytes}], history: [{id,status,submittedAt,reviewedAt,issueDate,reason,superseded}] }
 */
import api from './api';

const BASE = '/caregiver/vetting/police-clearance';

export const CLEARANCE_LIMITS = {
  maxFiles: 5,
  maxFileBytes: 10 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
};
export const CLEARANCE_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const extractError = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (error?.response?.status === 413) return 'Those files are too large. Please keep them within 20 MB in total.';
  return data?.message || error?.message || fallback;
};

/** Friendly client-side pre-check that mirrors the server rules (the server stays the authority). Returns a message or null. */
export const validateClearanceFiles = (files) => {
  if (!files || files.length === 0) return 'Please attach your police clearance (a PDF, or up to 5 photos/scans).';
  if (files.length > CLEARANCE_LIMITS.maxFiles) return `You can attach at most ${CLEARANCE_LIMITS.maxFiles} files.`;
  let total = 0;
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) return `"${f.name}" isn't a PDF, JPG or PNG.`;
    if (f.size === 0) return `"${f.name}" is empty.`;
    if (f.size > CLEARANCE_LIMITS.maxFileBytes) return `"${f.name}" is larger than 10 MB.`;
    total += f.size;
  }
  if (total > CLEARANCE_LIMITS.maxTotalBytes) return 'The files together must be 20 MB or smaller.';
  const pdfs = files.filter((f) => f.type === 'application/pdf').length;
  if (pdfs > 0 && files.length > 1) return 'Attach either a single PDF or up to 5 photos/scans — not a mix, and only one PDF.';
  return null;
};

const policeClearanceService = {
  /** GET — the caller's own latest status, reason, history. */
  async getStatus() {
    try {
      const response = await api.get(BASE);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching police clearance status:', error);
      return { success: false, error: extractError(error, 'Failed to load your police clearance status') };
    }
  },

  /** POST multipart: issueDate (yyyy-mm-dd), nameOnDocument, referenceNumber, files[]. */
  async submit({ issueDate, nameOnDocument, referenceNumber, files }) {
    try {
      const form = new FormData();
      form.append('issueDate', issueDate);
      form.append('nameOnDocument', nameOnDocument);
      form.append('referenceNumber', referenceNumber);
      files.forEach((f) => form.append('files', f, f.name));
      const response = await api.post(BASE, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error submitting police clearance:', error);
      return { success: false, error: extractError(error, 'We could not submit your police clearance. Please try again.') };
    }
  },

  /** GET one of the caller's own files as a Blob (sent with the auth header — there is no public URL). */
  async fetchFile(clearanceId, index) {
    try {
      const response = await api.get(`${BASE}/${clearanceId}/files/${index}`, { responseType: 'blob', timeout: 60000 });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: extractError(error, 'Could not open this file') };
    }
  },
};

export default policeClearanceService;
