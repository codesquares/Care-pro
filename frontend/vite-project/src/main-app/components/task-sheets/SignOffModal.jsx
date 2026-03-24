import { useState } from "react";
import SignatureCanvas from "./SignatureCanvas";

/**
 * SignOffModal — client signature capture before submitting a task sheet.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose(): close without submitting
 *  - onConfirm(signatureBase64): submit with signature
 *  - sheetNumber: visit number for display
 *  - submitting: boolean — external loading state
 */
const SignOffModal = ({ isOpen, onClose, onConfirm, sheetNumber, submitting = false }) => {
  const [signature, setSignature] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (submitting || !consentChecked) return;
    onConfirm(signature);
  };

  return (
    <div className="visit-modal-overlay" onClick={onClose}>
      <div className="visit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="visit-modal-header">
          <h3>✍️ Check Out — Visit {sheetNumber}</h3>
          <button className="visit-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="visit-modal-body">
          <p className="signoff-description">
            Please ask the client to sign below to confirm that the visit tasks have been completed.
          </p>

          <div className="signoff-canvas-area">
            <label className="signoff-label">Client Signature (Optional)</label>
            <SignatureCanvas onChange={setSignature} />
          </div>

          <p className="signoff-note">
            Signature is optional but recommended. You can submit without it.
          </p>

          {/* Consent checkbox */}
          <label className="signoff-consent">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
            <span>
              I confirm that all information entered for this visit is accurate and complete.
            </span>
          </label>
        </div>

        <div className="visit-modal-footer">
          <button className="visit-btn-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="visit-btn-submit"
            onClick={handleConfirm}
            disabled={submitting || !consentChecked}
          >
            {submitting ? "Submitting..." : "Submit Visit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOffModal;
