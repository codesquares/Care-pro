import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../../config';
import { SPECIALIZED_CERTIFICATE_TYPES } from '../../constants/serviceClassification';
import './certificate-upload-modal.css';

// Approved certificate types for caregivers
const APPROVED_CERTIFICATES = [
  {
    name: 'West African Senior School Certificate Examination (WASSCE)',
    issuer: 'West African Examinations Council (WAEC)',
    shortName: 'WASSCE',
    certCategory: 'educational',
  },
  {
    name: 'National Examination Council (NECO) Senior School Certificate Examination (SSCE)',
    issuer: 'National Examination Council (NECO)',
    shortName: 'NECO SSCE',
    certCategory: 'educational',
  },
  {
    name: 'National Business and Technical Examinations Board (NABTEB)',
    issuer: 'National Business and Technical Examinations Board (NABTEB)',
    shortName: 'NABTEB',
    certCategory: 'educational',
  },
  {
    name: 'National Youth Service Corps (NYSC) Certificate',
    issuer: 'National Youth Service Corps (NYSC)',
    shortName: 'NYSC Certificate',
    certCategory: 'educational',
  },
  // Specialized care certificates
  ...SPECIALIZED_CERTIFICATE_TYPES.map((cert) => ({
    name: cert.name,
    issuer: cert.name,
    shortName: cert.name,
    certCategory: cert.category,
  })),
];

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
  const [certificateYear, setCertificateYear] = useState('');
  const [certificateExpiry, setCertificateExpiry] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const getCaregiverId = () => {
    if (propCaregiverId) return propCaregiverId;
    try {
      return JSON.parse(localStorage.getItem('userDetails') || '{}').id || null;
    } catch {
      return null;
    }
  };

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const resetForm = () => {
    setCertificateFile(null);
    setSelectedCertificateType('');
    setCertificateYear('');
    setCertificateExpiry('');
  };

  const handleUpload = async () => {
    if (!certificateFile || !selectedCertificateType || !certificateYear) {
      toast.error('Please select certificate type, year, and upload a file');
      return;
    }

    const selectedCert = APPROVED_CERTIFICATES.find(
      (c) => c.name === selectedCertificateType,
    );
    if (!selectedCert) {
      toast.error('Invalid certificate type selected');
      return;
    }

    const caregiverId = getCaregiverId();
    if (!caregiverId) {
      toast.error('Unable to identify your account. Please log in again.');
      return;
    }

    try {
      setUploadLoading(true);

      const base64Certificate = await convertFileToBase64(certificateFile);

      const requestPayload = {
        certificateName: selectedCert.name,
        caregiverId,
        certificateIssuer: selectedCert.issuer,
        certificate: base64Certificate,
        yearObtained: new Date(certificateYear, 0, 1).toISOString(),
        ...(selectedCert.certCategory && {
          certificateCategory: selectedCert.certCategory,
        }),
        ...(certificateExpiry && {
          expiryDate: new Date(certificateExpiry).toISOString(),
        }),
      };

      const response = await axios.post(
        `${config.BASE_URL}/Certificates`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
          },
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
      console.error('Certificate upload failed:', err);
      toast.error(
        `Upload failed: ${err.response?.data?.message || err.message || 'Unknown error'}`,
      );
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
        <button className="cert-modal-close" onClick={handleCancel} title="Close">
          &times;
        </button>

        <h3 className="cert-modal-title">Upload Certificate</h3>

        {/* Certificate type select */}
        <div className="cert-modal-field">
          <label>
            Certificate Type <span className="cert-required">*</span>
          </label>
          <select
            value={selectedCertificateType}
            onChange={(e) => setSelectedCertificateType(e.target.value)}
          >
            <option value="">-- Select a certificate type --</option>
            {APPROVED_CERTIFICATES.map((cert, idx) => (
              <option key={idx} value={cert.name}>
                {cert.shortName}
              </option>
            ))}
          </select>
          {selectedCertificateType && (
            <p className="cert-modal-hint">
              Issuer:{' '}
              {APPROVED_CERTIFICATES.find((c) => c.name === selectedCertificateType)?.issuer}
            </p>
          )}
        </div>

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
            onChange={(e) => setCertificateFile(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* Actions */}
        <div className="cert-modal-actions">
          <button className="cert-modal-btn cert-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="cert-modal-btn cert-btn-upload"
            onClick={handleUpload}
            disabled={uploadLoading}
          >
            {uploadLoading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { APPROVED_CERTIFICATES };
export default CertificateUploadModal;
