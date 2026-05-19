/**
 * Payment Receipt Service
 *
 * Downloads PDF receipts for commitment fee and order payments.
 *
 * Endpoints:
 *   GET /api/payments/receipt/commitment/{txRef}
 *   GET /api/payments/receipt/order/{txRef}
 *
 * Both require a valid Bearer token. Ownership is verified server-side.
 * The response is application/pdf — the browser download is triggered
 * programmatically without opening a new tab.
 *
 * Error responses:
 *   400 — payment not yet completed
 *   403 — receipt belongs to another user
 *   404 — txRef not found
 */
import api from './api';

/**
 * Shared download helper.
 * Fires a programmatic <a download> click and immediately revokes the object URL.
 *
 * @param {string} endpoint  - relative API path, e.g. /payments/receipt/order/CAREPRO-ORDER-...
 * @param {string} filename  - suggested filename for the saved file
 * @returns {Promise<{ success: boolean, error?: string, status?: number }>}
 */
const _downloadPdf = async (endpoint, filename) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    const status = error.response?.status;
    let message;

    if (status === 400) {
      message = 'Receipt is not yet available — the payment may still be processing.';
    } else if (status === 403) {
      message = 'You are not authorised to download this receipt.';
    } else if (status === 404) {
      message = 'Receipt not found. Please check the transaction reference.';
    } else {
      message = error.message || 'Failed to download receipt. Please try again.';
    }

    console.error('[paymentReceiptService] Download failed:', { endpoint, status, message });
    return { success: false, error: message, status };
  }
};

const paymentReceiptService = {
  /**
   * Download the PDF receipt for a commitment fee payment.
   *
   * @param {string} txRef  - e.g. "CAREPRO-COMMIT-20240815-ABCD1234"
   * @returns {Promise<{ success: boolean, error?: string, status?: number }>}
   */
  downloadCommitmentReceipt(txRef) {
    return _downloadPdf(
      `/payments/receipt/commitment/${encodeURIComponent(txRef)}`,
      `CarePro-Receipt-Commitment-${txRef}.pdf`
    );
  },

  /**
   * Download the PDF receipt for a full order payment.
   *
   * @param {string} txRef  - e.g. "CAREPRO-ORDER-20240815-ABCD1234"
   * @returns {Promise<{ success: boolean, error?: string, status?: number }>}
   */
  downloadOrderReceipt(txRef) {
    return _downloadPdf(
      `/payments/receipt/order/${encodeURIComponent(txRef)}`,
      `CarePro-Receipt-Order-${txRef}.pdf`
    );
  },
};

export default paymentReceiptService;
