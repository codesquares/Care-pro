import { useState } from "react";

/**
 * Small reason-capturing dialog for declining a pending assignment offer.
 * Reason is optional server-side (DeclineAssignmentRequest.Reason has no
 * [Required], just [StringLength(500)]) — this dialog matches that: the
 * caregiver can submit with an empty reason.
 */
const AssignmentDeclineDialog = ({ isOpen, onCancel, onConfirm, submitting }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const remaining = 500 - reason.length;

  return (
    <div className="asn-dialog-overlay" onClick={submitting ? undefined : onCancel}>
      <div className="asn-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Decline this assignment?</h2>
        <p className="asn-dialog-body">
          This request will go back to our team for reassignment. You can optionally
          tell us why.
        </p>
        <textarea
          className="asn-dialog-textarea"
          placeholder="Reason (optional)"
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          rows={4}
        />
        <div className="asn-dialog-charcount">{remaining} characters left</div>
        <div className="asn-dialog-actions">
          <button
            type="button"
            className="asn-dialog-btn asn-dialog-btn--secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="asn-dialog-btn asn-dialog-btn--danger"
            onClick={() => onConfirm(reason)}
            disabled={submitting}
          >
            {submitting ? "Declining…" : "Decline assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDeclineDialog;
