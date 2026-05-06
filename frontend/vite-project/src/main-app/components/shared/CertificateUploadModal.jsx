import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../../config';
import { SPECIALIZED_CERTIFICATE_TYPES } from '../../constants/serviceClassification';
import './certificate-upload-modal.css';

// Fallback list — used only if GET /Certificates/types fails. The backend is
// the source of truth; CertificateName must exactly match the canonical value.
const FALLBACK_CERTIFICATES = [
  {
    name: 'West African Senior School Certificate Examination (WASSCE)',
    expectedIssuer: 'West African Examinations Council (WAEC)',
    flexibleIssuer: false,
    category: 'educational',
  },
  {
    name: 'National Examination Council (NECO) Senior School Certificate Examination (SSCE)',
    expectedIssuer: 'National Examination Council (NECO)',
    flexibleIssuer: false,
    category: 'educational',
  },
  {
    name: 'National Business and Technical Examinations Board (NABTEB)',
    expectedIssuer: 'National Business and Technical Examinations Board (NABTEB)',
    flexibleIssuer: false,
    category: 'educational',
  },
  {
    name: 'National Youth Service Corps (NYSC) Certificate',
    expectedIssuer: 'National Youth Service Corps (NYSC)',
    flexibleIssuer: false,
    category: 'educational',
  },
  ...SPECIALIZED_CERTIFICATE_TYPES.map((cert) => ({
    name: cert.name,
    expectedIssuer: cert.name,
    flexibleIssuer: true,
    category: cert.category,
  })),
];

// Module-level cache so the types list is fetched only once per page load.
let cachedCertificateTypes = null;
let cachedCertificateTypesPromise = null;

const fetchCertificateTypes = async () => {
  if (cachedCertificateTypes) return cachedCertificateTypes;
  if (cachedCertificateTypesPromise) return cachedCertificateTypesPromise;

  cachedCertificateTypesPromise = axios
    .get(`${config.BASE_URL}/Certificates/types`, {
      headers: { Accept: 'application/json' },
      timeout: 15000,
    })
    .then((res) => {
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      if (data.length === 0) {
        cachedCertificateTypesPromise = null;
        return FALLBACK_CERTIFICATES;
      }
      cachedCertificateTypes = data;
      return data;
    })
    .catch((err) => {
      console.error('Failed to fetch certificate types, using fallback list:', err);
      cachedCertificateTypesPromise = null;
      return FALLBACK_CERTIFICATES;
    });

  return cachedCertificateTypesPromise;
};

/**
 * Build a user-friendly error message from any axios/network failure.
 * Handles: network errors, timeouts, ASP.NET ProblemDetails (`title`,
 * `detail`, `errors`), plain `message` strings, file-size/type 4xx codes,
 * auth/permission codes, and server 5xx.
 */
const buildUploadErrorMessage = (err) => {
  // No response at all — request never reached the server, or was aborted.
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      return 'The upload timed out. Please check your connection and try again. Large files on slow networks can take a while.';
    }
    if (err.message === 'Network Error' || !navigator.onLine) {
      return 'Network error — we could not reach the server. Check your internet connection and try again.';
    }
    return `Upload failed before reaching the server: ${err.message || 'Unknown error'}`;
  }

  const { status, data } = err.response;

  // Field-level validation errors (ASP.NET ModelState / ProblemDetails).
  if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
    const lines = [];
    for (const [field, messages] of Object.entries(data.errors)) {
      const msg = Array.isArray(messages) ? messages.join(' ') : String(messages);
      // Hide ASP.NET's auto-prefixed '$.' field names which are confusing.
      const cleanField = field.replace(/^\$\./, '').trim();
      lines.push(cleanField ? `${cleanField}: ${msg}` : msg);
    }
    if (lines.length) return lines.join('\n');
  }

  // ProblemDetails-style title/detail.
  if (data && typeof data === 'object') {
    const detail = data.detail || data.message || data.title || data.error;
    if (detail) return String(detail);
  }

  // Plain string body (some servers return raw text on error).
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  // Fall back to status-code messages.
  switch (status) {
    case 400:
      return 'The server rejected the upload (400). Please double-check every field and try again.';
    case 401:
      return 'Your session has expired. Please sign in again and retry the upload.';
    case 403:
      return 'You do not have permission to upload this certificate.';
    case 404:
      return 'Upload endpoint not found (404). Please contact support.';
    case 409:
      return 'A certificate with these details already exists on your profile.';
    case 413:
      return 'The file is too large for the server to accept. Please use a file under 10 MB.';
    case 415:
      return 'Unsupported file type. Please upload a PDF, JPG, or PNG.';
    case 429:
      return 'Too many uploads in a short period. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return `Server error (${status}). Our team has been notified — please try again in a few minutes.`;
    default:
      return `Upload failed (HTTP ${status}). Please try again.`;
  }
};

/**
 * Self-contained certificate upload modal.
 * Can be dropped into any page — no dependency on ProfileInformation.
 *
 * Props:
 *  - isOpen        {boolean}  Controls visibility
 *  - onClose       {function} Called when the modal is dismissed
 *  - onUploadDone  {function} Called after a successful upload (optional)
 *  - caregiverId   {string}   Optional — falls back to localStorage
 */
const CertificateUploadModal = ({
  isOpen,
  onClose,
  onUploadDone,
  caregiverId: propCaregiverId,
}) => {
  const [certificateFile, setCertificateFile] = useState(null);
  const [selectedCertificateType, setSelectedCertificateType] = useState('');
  const [issuerInput, setIssuerInput] = useState('');
  const [certificateYear, setCertificateYear] = useState('');
  const [certificateExpiry, setCertificateExpiry] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [certificateTypes, setCertificateTypes] = useState(
    cachedCertificateTypes || [],
  );
  const [typesLoading, setTypesLoading] = useState(!cachedCertificateTypes);

  // Fetch the canonical types list once when the modal first opens.
  useEffect(() => {
    if (!isOpen) return;
    if (cachedCertificateTypes) {
      setCertificateTypes(cachedCertificateTypes);
      setTypesLoading(false);
      return;
    }
    let cancelled = false;
    setTypesLoading(true);
    fetchCertificateTypes().then((list) => {
      if (cancelled) return;
      setCertificateTypes(list);
      setTypesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectedCert = certificateTypes.find(
    (c) => c.name === selectedCertificateType,
  );

  // Auto-fill issuer when the selection changes.
  useEffect(() => {
    if (!selectedCert) {
      setIssuerInput('');
      return;
    }
    if (selectedCert.flexibleIssuer) {
      // Free-text: clear so the user types their own issuer.
      setIssuerInput('');
    } else {
      // Locked: prefill the exact expected value the backend requires.
      setIssuerInput(selectedCert.expectedIssuer || '');
    }
  }, [selectedCertificateType]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCaregiverId = () => {
    if (propCaregiverId) return propCaregiverId;
    try {
      return JSON.parse(localStorage.getItem('userDetails') || '{}').id || null;
    } catch {
      return null;
    }
  };

  // Backend cap: file must be ≤ 10 MB (request body cap is ~12 MB).
  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  const resetForm = () => {
    setCertificateFile(null);
    setSelectedCertificateType('');
    setIssuerInput('');
    setCertificateYear('');
    setCertificateExpiry('');
    setUploadError('');
  };

  const showError = (msg) => {
    setUploadError(msg);
    toast.error(msg, { autoClose: 8000 });
  };

  const handleUpload = async () => {
    setUploadError('');
    if (!certificateFile || !selectedCertificateType || !certificateYear) {
      showError('Please select a certificate type, enter the year obtained, and choose a file.');
      return;
    }

    if (!selectedCert) {
      showError('Please select a valid certificate type from the list.');
      return;
    }

    const issuerToSubmit = (issuerInput || '').trim();
    if (!issuerToSubmit) {
      showError('Please enter the certificate issuer.');
      return;
    }

    const caregiverId = getCaregiverId();
    if (!caregiverId) {
      showError('Unable to identify your account. Please log in again.');
      return;
    }

    if (certificateFile.size > MAX_FILE_BYTES) {
      showError('Certificate file is too large. Maximum allowed size is 10 MB.');
      return;
    }

    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('Certificate', certificateFile);
      // CertificateName MUST be the exact canonical value from /types — no trimming.
      formData.append('CertificateName', selectedCert.name);
      formData.append('CaregiverId', caregiverId);
      formData.append('CertificateIssuer', issuerToSubmit);
      formData.append(
        'YearObtained',
        new Date(certificateYear, 0, 1).toISOString(),
      );
      if (selectedCert.category) {
        formData.append('CertificateCategory', selectedCert.category);
      }
      if (certificateExpiry) {
        formData.append(
          'ExpiryDate',
          new Date(certificateExpiry).toISOString(),
        );
      }

      const response = await axios.post(
        `${config.BASE_URL}/Certificates`,
        formData,
        {
          headers: {
            // Let the browser set Content-Type with the multipart boundary.
            Accept: '*/*',
            Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
          timeout: 120000,
        },
      );

      // Handle verification status feedback
      // All certificates now go to admin review — no more auto-verification
      const verification = response.data?.verification;
      if (verification) {
        const status = verification.status;

        if (status === 'ManualReviewRequired' || status === 4) {
          toast.success(
            'Certificate uploaded! It has been queued for admin review. You will be notified once reviewed.',
            { autoClose: 6000 },
          );
        } else if (status === 'Verified') {
          // Edge case: admin pre-approved or legacy flow
          toast.success('Certificate uploaded and verified!');
        } else {
          // Any other status — still inform the user it's pending review
          toast.success(
            'Certificate uploaded successfully! Pending admin review.',
          );
        }
      } else {
        toast.success('Certificate uploaded successfully! Pending admin review.');
      }

      resetForm();
      onClose();
      if (onUploadDone) onUploadDone();
    } catch (err) {
      console.error('Certificate upload failed:', err, err.response?.data);
      showError(buildUploadErrorMessage(err));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cert-modal-overlay" onClick={handleCancel}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cert-modal-header">
          <h3 className="cert-modal-title">Upload Certificate</h3>
          <button className="cert-modal-close" onClick={handleCancel} title="Close">
            &times;
          </button>
        </div>

        <div className="cert-modal-body">
        {uploadError && (
          <div
            className="cert-modal-error"
            role="alert"
            aria-live="assertive"
          >
            <strong>Upload failed</strong>
            <p>{uploadError}</p>
            <button
              type="button"
              className="cert-modal-error-dismiss"
              onClick={() => setUploadError('')}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}
        {/* Certificate type select */}
        <div className="cert-modal-field">
          <label>
            Certificate Type <span className="cert-required">*</span>
          </label>
          <select
            value={selectedCertificateType}
            onChange={(e) => setSelectedCertificateType(e.target.value)}
            disabled={typesLoading}
          >
            <option value="">
              {typesLoading
                ? 'Loading certificate types…'
                : '-- Select a certificate type --'}
            </option>
            {certificateTypes.map((cert) => (
              <option key={cert.name} value={cert.name}>
                {cert.name}
              </option>
            ))}
          </select>
        </div>

        {/* Issuer */}
        {selectedCert && (
          <div className="cert-modal-field">
            <label>
              Issuer <span className="cert-required">*</span>
            </label>
            <input
              type="text"
              value={issuerInput}
              onChange={(e) => setIssuerInput(e.target.value)}
              readOnly={!selectedCert.flexibleIssuer}
              placeholder={
                selectedCert.flexibleIssuer
                  ? 'Enter the issuing institution'
                  : ''
              }
            />
            {!selectedCert.flexibleIssuer && (
              <p className="cert-modal-hint">
                This issuer is required and cannot be changed.
              </p>
            )}
          </div>
        )}

        {/* Year obtained */}
        <div className="cert-modal-field">
          <label>
            Year Obtained <span className="cert-required">*</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 2020"
            value={certificateYear}
            onChange={(e) => setCertificateYear(e.target.value)}
            min="1950"
            max={new Date().getFullYear()}
            step="1"
          />
        </div>

        {/* Expiry date */}
        <div className="cert-modal-field">
          <label>Expiry Date <span className="cert-optional">(optional)</span></label>
          <input
            type="date"
            value={certificateExpiry}
            onChange={(e) => setCertificateExpiry(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          {!certificateExpiry && (
            <p className="cert-modal-hint">Leave blank for non-expiring certificates.</p>
          )}
        </div>

        {/* File input */}
        <div className="cert-modal-field">
          <label>
            Certificate File <span className="cert-required">*</span>
          </label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.size > MAX_FILE_BYTES) {
                toast.error('Certificate file is too large. Maximum allowed size is 10 MB.');
                e.target.value = '';
                setCertificateFile(null);
                return;
              }
              setCertificateFile(file);
            }}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <p className="cert-modal-hint">PDF, JPG or PNG. Max 10 MB.</p>
        </div>

        {/* Actions */}
        <div className="cert-modal-actions">
          <button className="cert-modal-btn cert-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="cert-modal-btn cert-btn-upload"
            onClick={handleUpload}
            disabled={uploadLoading || typesLoading}
          >
            {uploadLoading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export { FALLBACK_CERTIFICATES as APPROVED_CERTIFICATES };
export default CertificateUploadModal;
