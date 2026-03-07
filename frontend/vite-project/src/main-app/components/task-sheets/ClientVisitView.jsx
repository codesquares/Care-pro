import { useState, useEffect } from "react";
import ObservationReportService from "../../services/observationReportService";
import IncidentReportService from "../../services/incidentReportService";
import "./ClientVisitView.css";

/**
 * ClientVisitView — read-only view of a single visit sheet for the client.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - orderId: the order ID
 */
const ClientVisitView = ({ sheet, orderId }) => {
  const [observations, setObservations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showObservations, setShowObservations] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const tasks = sheet.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const isSubmitted = sheet.status === "submitted";
  const checkin = sheet.checkin || null;

  // Fetch reports when expanded
  useEffect(() => {
    if (!showObservations && !showIncidents) return;
    if (observations.length > 0 || incidents.length > 0) return;

    const fetchReports = async () => {
      setLoadingReports(true);
      const [obsResult, incResult] = await Promise.all([
        ObservationReportService.getByOrder(orderId, sheet.id),
        IncidentReportService.getByOrder(orderId),
      ]);

      if (obsResult.success) {
        // Filter to this sheet's reports
        setObservations(
          obsResult.data.filter((r) => r.taskSheetId === sheet.id)
        );
      }
      if (incResult.success) {
        setIncidents(
          incResult.data.filter((r) => r.taskSheetId === sheet.id)
        );
      }
      setLoadingReports(false);
    };
    fetchReports();
  }, [showObservations, showIncidents, orderId, sheet.id, observations.length, incidents.length]);

  return (
    <div className="cv-page">
      {/* Status banner */}
      <div className="cv-status-row">
        {isSubmitted ? (
          <span className="cv-status-badge cv-status-badge--submitted">
            ✓ Completed
            {sheet.submittedAt &&
              ` — ${new Date(sheet.submittedAt).toLocaleDateString()}`}
          </span>
        ) : (
          <span className="cv-status-badge cv-status-badge--pending">
            ◌ In Progress
          </span>
        )}
      </div>

      {/* Check-in info */}
      {checkin && (
        <div className="cv-checkin">
          <span className="cv-checkin-icon">📍</span>
          <div className="cv-checkin-details">
            <span className="cv-checkin-label">Caregiver Checked In</span>
            <span className="cv-checkin-time">
              {checkin.checkinTimestamp
                ? new Date(checkin.checkinTimestamp).toLocaleString()
                : "—"}
            </span>
            {checkin.distanceFromServiceAddress != null && (
              <span className="cv-checkin-distance">
                {checkin.distanceFromServiceAddress}m from service address
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="cv-progress">
        <div className="cv-progress-bar">
          <div
            className="cv-progress-fill"
            style={{
              width:
                tasks.length > 0
                  ? `${(completedCount / tasks.length) * 100}%`
                  : "0%",
            }}
          />
        </div>
        <span className="cv-progress-text">
          {completedCount}/{tasks.length} tasks completed
        </span>
      </div>

      {/* Task list (read-only) */}
      <div className="cv-task-list">
        {tasks.map((task, index) => (
          <div
            key={task.id || `t-${index}`}
            className={`cv-task ${task.completed ? "cv-task--done" : ""}`}
          >
            <span className="cv-task-check">
              {task.completed ? "✓" : "○"}
            </span>
            <span className="cv-task-text">{task.text}</span>
            {task.addedByCaregiver && (
              <span className="cv-task-custom-badge">Added by caregiver</span>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="cv-no-tasks">No tasks recorded for this visit.</p>
        )}
      </div>

      {/* Client Signature */}
      {isSubmitted && sheet.clientSignature?.signatureUrl && (
        <div className="cv-signature">
          <span className="cv-signature-label">Your Signature</span>
          <img
            src={sheet.clientSignature.signatureUrl}
            alt="Client signature"
            className="cv-signature-image"
          />
          {sheet.clientSignature.signedAt && (
            <span className="cv-signature-date">
              Signed {new Date(sheet.clientSignature.signedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Reports section */}
      <div className="cv-reports">
        {/* Observation reports */}
        {(sheet.observationReportCount > 0 || observations.length > 0) && (
          <div className="cv-report-group">
            <button
              className="cv-report-toggle"
              onClick={() => setShowObservations(!showObservations)}
            >
              📋 Observation Reports
              <span className="cv-report-count">
                {sheet.observationReportCount || observations.length}
              </span>
              <span className={`cv-chevron ${showObservations ? "cv-chevron--open" : ""}`}>
                ›
              </span>
            </button>
            {showObservations && (
              <div className="cv-report-list">
                {loadingReports ? (
                  <p className="cv-report-loading">Loading...</p>
                ) : observations.length > 0 ? (
                  observations.map((obs, i) => (
                    <div key={obs.id || i} className="cv-report-card">
                      <div className="cv-report-card-header">
                        <span className="cv-report-category">
                          {ObservationReportService.CATEGORY_LABELS[obs.category] || obs.category}
                        </span>
                        <span className={`cv-severity cv-severity--${obs.severity}`}>
                          {ObservationReportService.SEVERITY_LABELS[obs.severity] || obs.severity}
                        </span>
                      </div>
                      <p className="cv-report-description">{obs.description}</p>
                      {obs.createdAt && (
                        <span className="cv-report-date">
                          {new Date(obs.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="cv-report-loading">No observation reports found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Incident reports */}
        {(sheet.incidentReportCount > 0 || incidents.length > 0) && (
          <div className="cv-report-group">
            <button
              className="cv-report-toggle cv-report-toggle--incident"
              onClick={() => setShowIncidents(!showIncidents)}
            >
              🚨 Incident Reports
              <span className="cv-report-count cv-report-count--incident">
                {sheet.incidentReportCount || incidents.length}
              </span>
              <span className={`cv-chevron ${showIncidents ? "cv-chevron--open" : ""}`}>
                ›
              </span>
            </button>
            {showIncidents && (
              <div className="cv-report-list">
                {loadingReports ? (
                  <p className="cv-report-loading">Loading...</p>
                ) : incidents.length > 0 ? (
                  incidents.map((inc, i) => (
                    <div key={inc.id || i} className="cv-report-card cv-report-card--incident">
                      <div className="cv-report-card-header">
                        <span className="cv-report-category">
                          {IncidentReportService.INCIDENT_TYPE_LABELS[inc.incidentType] || inc.incidentType}
                        </span>
                        <span className={`cv-severity cv-severity--${inc.severity}`}>
                          {IncidentReportService.SEVERITY_LABELS[inc.severity] || inc.severity}
                        </span>
                      </div>
                      <p className="cv-report-description">{inc.description}</p>
                      {inc.actionsTaken && (
                        <p className="cv-report-actions-taken">
                          <strong>Actions taken:</strong> {inc.actionsTaken}
                        </p>
                      )}
                      {inc.dateTime && (
                        <span className="cv-report-date">
                          Occurred: {new Date(inc.dateTime).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="cv-report-loading">No incident reports found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientVisitView;
