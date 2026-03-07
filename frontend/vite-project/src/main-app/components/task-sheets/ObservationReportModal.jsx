import { useState } from "react";
import { toast } from "react-toastify";
import ObservationReportService from "../../services/observationReportService";

/**
 * ObservationReportModal — form for creating observation reports.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose(): close the modal
 *  - orderId: string
 *  - taskSheetId: string
 *  - onReportCreated(report): callback after successful creation
 */
const ObservationReportModal = ({ isOpen, onClose, orderId, taskSheetId, onReportCreated }) => {
  const [category, setCategory] = useState("health_observation");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("low");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Maximum 3 photos allowed.");
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
          if (prev.length >= 3) return prev;
          return [...prev, reader.result];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!description.trim()) {
      toast.error("Please provide a description.");
      return;
    }

    setSubmitting(true);
    const result = await ObservationReportService.create({
      orderId,
      taskSheetId,
      category,
      description,
      severity,
      photos,
    });

    if (result.success) {
      toast.success("Observation report submitted.");
      if (onReportCreated) onReportCreated(result.data);
      // Reset form
      setCategory("health_observation");
      setDescription("");
      setSeverity("low");
      setPhotos([]);
      onClose();
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="visit-modal-overlay" onClick={onClose}>
      <div className="visit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="visit-modal-header">
          <h3>📋 Observation Report</h3>
          <button className="visit-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="visit-modal-body">
          <div className="visit-form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {ObservationReportService.VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {ObservationReportService.CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="visit-form-group">
            <label>Severity</label>
            <div className="severity-options">
              {ObservationReportService.VALID_SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  type="button"
                  className={`severity-btn severity-btn--${sev} ${severity === sev ? "severity-btn--active" : ""}`}
                  onClick={() => setSeverity(sev)}
                >
                  {ObservationReportService.SEVERITY_LABELS[sev]}
                </button>
              ))}
            </div>
          </div>

          <div className="visit-form-group">
            <label>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you observed..."
              rows={5}
              maxLength={2000}
            />
            <span className="char-count">{description.length}/2000</span>
          </div>

          <div className="visit-form-group">
            <label>Photos (optional, max 3)</label>
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
              {photos.length < 3 && (
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
            className="visit-btn-submit"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservationReportModal;
