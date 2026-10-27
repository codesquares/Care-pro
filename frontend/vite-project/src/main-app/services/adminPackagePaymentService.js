/**
 * Admin Package Payment Service
 * Staff-triggered Flutterwave payment-link generation for a client + package
 * (api/admin/package-payments, gated by OperationsPolicy on the backend).
 *
 * The link is delivered to the client manually (e.g. over WhatsApp). A successful
 * payment creates the real PackageRequest server-side via the Flutterwave webhook —
 * nothing on the frontend creates it.
 */
import api from './api';

const BASE = '/admin/package-payments';

// This endpoint's failures come back as { success: false, errors: [...] } (service-level),
// or as ASP.NET ModelState / ProblemDetails (validation), rather than { message }.
const extractError = (error, fallback) => {
  const data = error.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join(' ');
  if (data?.errors && typeof data.errors === 'object') {
    const msgs = Object.values(data.errors).flat().filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  return data?.message || data?.title || error.message || fallback;
};

const AdminPackagePaymentService = {
  /**
   * Generate (or reuse a still-fresh pending) Flutterwave payment link.
   * Endpoint: POST /api/admin/package-payments/initiate
   * @param {Object} params
   * @param {string} params.clientId
   * @param {string} params.packageId
   * @param {number} [params.extraDays] - Only valid when the package has an additionalDayPrice
   * @param {'OneTime'|'Recurring'} [params.billingType]
   * @param {string} [params.notes]
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   *   data: { message, transactionReference, paymentLink, clientId, packageId, extraDays,
   *           billingType, basePrice, additionalDayAmount, totalAmount, currency }
   */
  async initiatePaymentLink({ clientId, packageId, extraDays = 0, billingType = 'OneTime', notes }) {
    try {
      const response = await api.post(`${BASE}/initiate`, {
        ClientId: clientId,
        PackageId: packageId,
        ExtraDays: extraDays,
        BillingType: billingType,
        Notes: notes?.trim() || null,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating package payment link:', error);
      return { success: false, error: extractError(error, 'Failed to generate payment link') };
    }
  },
};

export default AdminPackagePaymentService;
