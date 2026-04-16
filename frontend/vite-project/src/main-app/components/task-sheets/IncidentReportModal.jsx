import { useState } from "react";
import { toast } from "react-toastify";
import IncidentReportService from "../../services/incidentReportService";

/**
 * IncidentReportModal — form for creating incident reports.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose(): close the modal
 *  - orderId: string
 *  - taskSheetId: string (optional)
 *  - onReportCreated(report): callback after successful creation
 */
const IncidentReportModal = ({ isOpen, onClose, orderId, taskSheetId, onReportCreated }) => {
  const [incidentType, setIncidentType] = useState("fall");
  const [dateTime, setDateTime] = useState(() => {
    // Default to current local datetime string for the input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [description, setDescription] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed.");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => {
          if (prev.length >= 5) return prev;
          return [...prev, reader.result];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!description.trim()) {
      toast.error("Please describe the incident.");
      return;
    }

    setSubmitting(true);
    const result = await IncidentReportService.create({
      orderId,
      taskSheetId: taskSheetId || null,
      incidentType,
      dateTime: new Date(dateTime).toISOString(),
      description,
      actionsTaken,
      witnesses,
      severity,
      photos,
    });

    if (result.success) {
      toast.success("Incident report submitted.");
      if (onReportCreated) onReportCreated(result.data);
      // Reset form
      setIncidentType("fall");
      setDescription("");
      setActionsTaken("");
      setWitnesses("");
      setSeverity("minor");
      setPhotos([]);
      onClose();
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="visit-modal-overlay" onClick={onClose}>
      <div className="visit-modal visit-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="visit-modal-header visit-modal-header--incident">
          <h3>🚨 Incident Report</h3>
          <button className="visit-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="visit-modal-body">
          <div className="visit-form-row">
            <div className="visit-form-group visit-form-group--half">
              <label>Incident Type</label>
              <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                {IncidentReportService.VALID_INCIDENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {IncidentReportService.INCIDENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="visit-form-group visit-form-group--half">
              <label>Date & Time of Incident</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
          </div>

          <div className="visit-form-group">
            <label>Severity</label>
            <div className="severity-options">
              {IncidentReportService.VALID_SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  type="button"
                  className={`severity-btn severity-btn--incident-${sev} ${severity === sev ? "severity-btn--active" : ""}`}
                  onClick={() => setSeverity(sev)}
                >
                  {IncidentReportService.SEVERITY_LABELS[sev]}
                </button>
              ))}
            </div>
          </div>

          <div className="visit-form-group">
            <label>Description of Incident *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail..."
              rows={5}
              maxLength={3000}
            />
            <span className="char-count">{description.length}/3000</span>
          </div>

          <div className="visit-form-group">
            <label>Actions Taken</label>
            <textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="What immediate steps were taken? (e.g., first aid, called emergency contact)"
              rows={3}
              maxLength={2000}
            />
            <span className="char-count">{actionsTaken.length}/2000</span>
          </div>

          <div className="visit-form-group">
            <label>Witnesses (optional)</label>
            <input
              type="text"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
              placeholder="Names of any witnesses present"
            />
          </div>

          <div className="visit-form-group">
            <label>Photos (optional, max 5)</label>
            <div className="photo-upload-area">
              {photos.map((photo, idx) => (
                <div key={idx} className="photo-thumb">
                  <img src={photo} alt={`Photo ${idx + 1}`} />
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => handleRemovePhoto(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="photo-add-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoAdd}
                    style={{ display: "none" }}
                  />
                  + Add Photo
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="visit-modal-footer">
          <button className="visit-btn-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="visit-btn-submit visit-btn-submit--incident"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            {submitting ? "Submitting..." : "Submit Incident Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
