import { useState } from "react";
import ObservationReportService from "../../services/observationReportService";
import IncidentReportService from "../../services/incidentReportService";
import "./ClientVisitView.css";

const formatWat = (d) =>
  new Date(d).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " (WAT)";

/**
 * PackageVisitReports — the client's view of the observation + incident reports on one package visit.
 * Counts come from the visit itself; the report bodies load lazily on first expand via the
 * client-scoped package-request endpoints (403 for anyone but the owning client).
 */
const PackageVisitReports = ({ packageRequestId, sheet }) => {
  const obsCount = sheet.observationReportCount || 0;
  const incCount = sheet.incidentReportCount || 0;
  const [open, setOpen] = useState(null); // null | 'obs' | 'inc'
  const [obs, setObs] = useState(null);
  const [inc, setInc] = useState(null);
  const [error, setError] = useState(null);

  if (obsCount === 0 && incCount === 0) return null;

  const toggle = async (kind) => {
    if (open === kind) return setOpen(null);
    setOpen(kind);
    setError(null);
    if (kind === "obs" && obs === null) {
      const r = await ObservationReportService.getByPackageRequest(packageRequestId, sheet.id);
      if (r.success) setObs(r.data.filter((x) => x.taskSheetId === sheet.id));
      else setError(r.error);
    }
    if (kind === "inc" && inc === null) {
      const r = await IncidentReportService.getByPackageRequest(packageRequestId);
      if (r.success) setInc(r.data.filter((x) => x.taskSheetId === sheet.id));
      else setError(r.error);
    }
  };

  return (
    <div className="cv-report-group" data-testid="package-visit-reports">
      {obsCount > 0 && (
        <>
          <button className="cv-report-toggle" onClick={() => toggle("obs")}>
            📋 Observation Reports <span className="cv-report-count">{obsCount}</span>
          </button>
          {open === "obs" && (
            <div className="cv-report-list">
              {error ? <p className="error-message">{error}</p> : obs === null ? <p className="cv-report-loading">Loading...</p> : obs.map((o) => (
                <div key={o.id} className="cv-report-card">
                  <div className="cv-report-card-header">
                    <span className="cv-report-category">{ObservationReportService.CATEGORY_LABELS[o.category] || o.category}</span>
                    <span className={`cv-severity cv-severity--${o.severity}`}>{ObservationReportService.SEVERITY_LABELS[o.severity] || o.severity}</span>
                  </div>
                  <p className="cv-report-description">{o.description}</p>
                  {o.createdAt && <span className="cv-report-date">{formatWat(o.createdAt)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {incCount > 0 && (
        <>
          <button className="cv-report-toggle cv-report-toggle--incident" onClick={() => toggle("inc")}>
            🚨 Incident Reports <span className="cv-report-count cv-report-count--incident">{incCount}</span>
          </button>
          {open === "inc" && (
            <div className="cv-report-list">
              {error ? <p className="error-message">{error}</p> : inc === null ? <p className="cv-report-loading">Loading...</p> : inc.map((i) => (
                <div key={i.id} className="cv-report-card cv-report-card--incident">
                  <div className="cv-report-card-header">
                    <span className="cv-report-category">{IncidentReportService.INCIDENT_TYPE_LABELS[i.incidentType] || i.incidentType}</span>
                    <span className={`cv-severity cv-severity--${i.severity}`}>{IncidentReportService.SEVERITY_LABELS[i.severity] || i.severity}</span>
                  </div>
                  <p className="cv-report-description">{i.description}</p>
                  {i.actionsTaken && <p className="cv-report-actions-taken"><strong>Actions taken:</strong> {i.actionsTaken}</p>}
                  {i.dateTime && <span className="cv-report-date">Occurred: {formatWat(i.dateTime)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PackageVisitReports;
