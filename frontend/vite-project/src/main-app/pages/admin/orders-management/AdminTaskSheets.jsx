import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../../services/taskSheetService";
import VisitCheckinService from "../../../services/visitCheckinService";
import "./AdminTaskSheets.css";

/**
 * Convert a UTC datetime string to Nigerian time (WAT, UTC+1, no DST).
 */
const formatWAT = (utcString, opts = {}) => {
  if (!utcString) return "—";
  return new Date(utcString).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
};

const formatDuration = (minutes) => {
  if (minutes == null) return "—";
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  return `${Math.round(minutes)} min`;
};

const formatTimeStr = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
};

const formatWATDate = (utcString) => {
  if (!utcString) return "—";
  return new Date(utcString).toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * AdminTaskSheets — shows all task sheets for an order in the admin order detail panel.
 *
 * Props:
 *  - orderId: string
 */
const AdminTaskSheets = ({ orderId }) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Reschedule inline form state
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Manual check-in form state
  const [manualCheckinId, setManualCheckinId] = useState(null);
  const [manualCheckinForm, setManualCheckinForm] = useState({
    latitude: "",
    longitude: "",
    accuracy: "50",
    checkinTimestamp: "",
  });
  const [manualCheckinLoading, setManualCheckinLoading] = useState(false);

  const fetchSheets = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    const result = await TaskSheetService.getSheetsByOrderId(orderId);
    if (result.success) {
      setSheets(
        (result.sheets || []).sort((a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0))
      );
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // ── Badge helpers ──────────────────────────────────────────────────────────

  const checkinStatusBadge = (sheet) => {
    const { status, checkin } = sheet;
    if (status === "scheduled") {
      return <span className="ats-badge ats-badge--grey">Not started</span>;
    }
    if (status === "in-progress" && !checkin) {
      return <span className="ats-badge ats-badge--yellow">Awaiting check-in</span>;
    }
    if (status === "in-progress" && checkin && !checkin.isLateCheckin) {
      return <span className="ats-badge ats-badge--green">Checked in</span>;
    }
    if (status === "in-progress" && checkin?.isLateCheckin) {
      return (
        <span className="ats-badge ats-badge--amber">
          Late check-in ({checkin.minutesLate}min)
        </span>
      );
    }
    if ((status === "submitted" || status === "reviewed") && sheet.visitDurationMinutes != null) {
      return (
        <span className="ats-badge ats-badge--blue">
          Duration: {formatDuration(sheet.visitDurationMinutes)}
        </span>
      );
    }
    if (status === "submitted" || status === "reviewed") {
      return <span className="ats-badge ats-badge--blue">Submitted</span>;
    }
    if (status === "cancelled") {
      return <span className="ats-badge ats-badge--red">Cancelled</span>;
    }
    return null;
  };

  const reviewBadge = (sheet) => {
    if (sheet.clientReviewStatus === "approved") {
      return <span className="ats-badge ats-badge--green">✓ Approved</span>;
    }
    if (sheet.clientReviewStatus === "disputed") {
      return (
        <span className="ats-badge ats-badge--red" title={sheet.clientDisputeReason || ""}>
          ⚑ Disputed
        </span>
      );
    }
    if (sheet.status === "submitted" || sheet.status === "reviewed") {
      return <span className="ats-badge ats-badge--grey">Pending review</span>;
    }
    return null;
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleReschedule = async (sheetId) => {
    if (!rescheduleDate && !rescheduleStartTime && !rescheduleEndTime) {
      toast.error("Please select a new date, a new time window, or both.");
      return;
    }
    setRescheduling(true);
    const result = await TaskSheetService.rescheduleSheet(sheetId, {
      newDate: rescheduleDate || null,
      newStartTime: rescheduleStartTime || null,
      newEndTime: rescheduleEndTime || null,
      reason: rescheduleReason.trim() || undefined,
    });
    if (result.success) {
      const timeNote = result.data.scheduledStartTime && result.data.scheduledEndTime
        ? ` · ${formatTimeStr(result.data.scheduledStartTime)}–${formatTimeStr(result.data.scheduledEndTime)} (WAT)`
        : "";
      toast.success(
        `Rescheduled: ${formatWAT(result.data.oldDate)} → ${formatWAT(result.data.newDate)}${timeNote}`
      );
      setRescheduleId(null);
      setRescheduleDate("");
      setRescheduleStartTime("");
      setRescheduleEndTime("");
      setRescheduleReason("");
      fetchSheets();
    } else {
      toast.error(result.error || "Failed to reschedule.");
    }
    setRescheduling(false);
  };

  const handleManualCheckin = async (sheet) => {
    const { latitude, longitude, accuracy, checkinTimestamp } = manualCheckinForm;
    if (!latitude || !longitude || !checkinTimestamp) {
      toast.error("Latitude, longitude, and check-in time are required.");
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const acc = parseFloat(accuracy) || 50;
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid coordinates — please enter valid numbers.");
      return;
    }
    setManualCheckinLoading(true);
    const result = await VisitCheckinService.adminManualCheckin({
      taskSheetId: sheet.id,
      orderId,
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      checkinTimestamp: new Date(checkinTimestamp).toISOString(),
    });
    if (result.success) {
      const lateNote = result.data.isLateCheckin
        ? ` (${result.data.minutesLate} minute${result.data.minutesLate !== 1 ? "s" : ""} late)`
        : "";
      toast.success(`Check-in recorded at ${formatWAT(result.data.checkinTimestamp)}${lateNote}.`);
      setManualCheckinId(null);
      setManualCheckinForm({ latitude: "", longitude: "", accuracy: "50", checkinTimestamp: "" });
      fetchSheets();
    } else {
      toast.error(result.error || "Manual check-in failed.");
    }
    setManualCheckinLoading(false);
  };

  const openReschedule = (e, sheetId) => {
    e.stopPropagation();
    setExpandedId(null);
    setManualCheckinId(null);
    setRescheduleDate("");
    setRescheduleStartTime("");
    setRescheduleEndTime("");
    setRescheduleReason("");
    setRescheduleId((prev) => (prev === sheetId ? null : sheetId));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="ats-loading">Loading task sheets…</div>;
  }

  if (error) {
    return (
      <div className="ats-error">
        <p>{error}</p>
        <button onClick={fetchSheets}>Retry</button>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="ats-empty">No task sheets have been created for this order yet.</div>
    );
  }

  return (
    <div className="ats-container">
      <div className="ats-header">
        <h4 className="ats-title">
          Task Sheets <span className="ats-count">{sheets.length}</span>
        </h4>
      </div>

      <div className="ats-list">
        {sheets.map((sheet) => {
          const isExpanded = expandedId === sheet.id;
          const isRescheduling = rescheduleId === sheet.id;
          const isManualCheckin = manualCheckinId === sheet.id;

          return (
            <div
              key={sheet.id}
              className={`ats-row${sheet.clientReviewStatus === "disputed" ? " ats-row--disputed" : ""}`}
            >
              {/* ── Row summary (always visible) ── */}
              <div
                className="ats-row-summary"
                onClick={() => setExpandedId(isExpanded ? null : sheet.id)}
              >
                <div className="ats-row-left">
                  <span className="ats-visit-num">Visit {sheet.sheetNumber}</span>
                  <span className={`ats-status-pill ats-status-pill--${sheet.status}`}>
                    {sheet.status}
                  </span>
                </div>

                <div className="ats-row-badges">
                  {checkinStatusBadge(sheet)}
                  {reviewBadge(sheet)}
                  {sheet.observationReportCount > 0 && (
                    <span className="ats-report-badge ats-report-badge--obs" title="Observation reports">
                      👁 {sheet.observationReportCount}
                    </span>
                  )}
                  {sheet.incidentReportCount > 0 && (
                    <span className="ats-report-badge ats-report-badge--inc" title="Incident reports">
                      ⚑ {sheet.incidentReportCount}
                    </span>
                  )}
                </div>

                <div className="ats-row-right">
                  {sheet.status === "scheduled" && (
                    <button
                      className="ats-action-btn ats-action-btn--reschedule"
                      onClick={(e) => openReschedule(e, sheet.id)}
                    >
                      📅 Reschedule
                    </button>
                  )}
                  <span className={`ats-chevron${isExpanded ? " ats-chevron--open" : ""}`}>›</span>
                </div>
              </div>

              {/* ── Dispute reason banner ── */}
              {sheet.clientReviewStatus === "disputed" && sheet.clientDisputeReason && (
                <div className="ats-dispute-banner">
                  <span className="ats-dispute-icon">⚑</span>
                  <span className="ats-dispute-reason">{sheet.clientDisputeReason}</span>
                </div>
              )}

              {/* ── Reschedule inline form ── */}
              {isRescheduling && (
                <div className="ats-reschedule-form">
                  {sheet.scheduledStartTime && sheet.scheduledEndTime && (
                    <p className="ats-reschedule-hint">
                      Visit {sheet.sheetNumber} &middot; {formatTimeStr(sheet.scheduledStartTime)}{" \u2013 "}{formatTimeStr(sheet.scheduledEndTime)} (WAT) &mdash; update the date, the time window, or both.
                    </p>
                  )}
                  <div className="ats-form-field">
                    <label className="ats-form-label">New visit date <span className="ats-form-optional">(optional if changing time only)</span></label>
                    <input
                      type="date"
                      className="ats-form-input"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="ats-form-field">
                    <label className="ats-form-label">New time window — Nigerian time (WAT) <span className="ats-form-optional">(optional if changing date only)</span></label>
                    <div className="ats-time-row">
                      <input
                        type="time"
                        className="ats-form-input ats-form-input--time"
                        value={rescheduleStartTime}
                        onChange={(e) => setRescheduleStartTime(e.target.value)}
                      />
                      <span className="ats-time-sep">–</span>
                      <input
                        type="time"
                        className="ats-form-input ats-form-input--time"
                        value={rescheduleEndTime}
                        onChange={(e) => setRescheduleEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="ats-form-field">
                    <label className="ats-form-label">Reason (optional)</label>
                    <input
                      type="text"
                      className="ats-form-input"
                      placeholder="e.g. Client requested change"
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                    />
                  </div>
                  <div className="ats-form-actions">
                    <button
                      className="ats-action-btn ats-action-btn--confirm"
                      disabled={rescheduling || (!rescheduleDate && !rescheduleStartTime && !rescheduleEndTime)}
                      onClick={() => handleReschedule(sheet.id)}
                    >
                      {rescheduling ? "Saving…" : "Confirm Reschedule"}
                    </button>
                    <button
                      className="ats-action-btn ats-action-btn--cancel"
                      onClick={() => {
                        setRescheduleId(null);
                        setRescheduleDate("");
                        setRescheduleStartTime("");
                        setRescheduleEndTime("");
                        setRescheduleReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Expanded detail ── */}
              {isExpanded && (
                <div className="ats-detail">

                  {/* Check-In Details section */}
                  <div className="ats-section">
                    <h5 className="ats-section-title">Check-In Details</h5>
                    {sheet.checkin ? (
                      <div className="ats-checkin-detail">
                        {sheet.scheduledStartTime && sheet.scheduledEndTime && (
                          <div className="ats-checkin-row">
                            <span className="ats-checkin-key">Scheduled window</span>
                            <span className="ats-checkin-val">
                              {formatTimeStr(sheet.scheduledStartTime)}{" – "}{formatTimeStr(sheet.scheduledEndTime)}
                            </span>
                          </div>
                        )}
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Arrival time (WAT)</span>
                          <span className="ats-checkin-val">
                            {formatWAT(sheet.checkin.checkinTimestamp)}
                          </span>
                        </div>
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">GPS coordinates</span>
                          <span className="ats-checkin-val ats-mono">
                            {sheet.checkin.latitude?.toFixed(6)}, {sheet.checkin.longitude?.toFixed(6)}
                          </span>
                        </div>
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">GPS accuracy</span>
                          <span className="ats-checkin-val">
                            {sheet.checkin.accuracy != null
                              ? `${Math.round(sheet.checkin.accuracy)}m`
                              : "—"}
                          </span>
                        </div>
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Distance from address</span>
                          <span className="ats-checkin-val">
                            {sheet.checkin.distanceFromServiceAddress != null
                              ? `${Math.round(sheet.checkin.distanceFromServiceAddress)}m`
                              : "—"}
                          </span>
                        </div>
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Arrival status</span>
                          <span className="ats-checkin-val">
                            {sheet.checkin.isLateCheckin ? (
                              <span className="ats-arrival-badge ats-arrival-badge--late">
                                Late — {sheet.checkin.minutesLate} min
                              </span>
                            ) : (
                              <span className="ats-arrival-badge ats-arrival-badge--ontime">
                                On Time
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="ats-no-checkin">
                        <span>No check-in recorded.</span>
                        {sheet.status !== "submitted" &&
                          sheet.status !== "reviewed" &&
                          sheet.status !== "cancelled" && (
                          <button
                            className="ats-action-btn ats-action-btn--manual"
                            onClick={() =>
                              setManualCheckinId(isManualCheckin ? null : sheet.id)
                            }
                          >
                            📍 Record manual check-in
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual check-in form */}
                  {isManualCheckin && !sheet.checkin && (
                    <div className="ats-manual-checkin-form">
                      <h5 className="ats-section-title">Manual Check-In</h5>
                      <p className="ats-form-hint">
                        Use this when the caregiver&apos;s device failed to record check-in.
                        Enter the caregiver&apos;s actual arrival details.
                      </p>
                      <div className="ats-form-field">
                        <label className="ats-form-label">Check-in time (caregiver&apos;s arrival) *</label>
                        <input
                          type="datetime-local"
                          className="ats-form-input"
                          value={manualCheckinForm.checkinTimestamp}
                          onChange={(e) =>
                            setManualCheckinForm((f) => ({
                              ...f,
                              checkinTimestamp: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="ats-form-row ats-form-row--cols">
                        <div className="ats-form-field">
                          <label className="ats-form-label">Latitude *</label>
                          <input
                            type="number"
                            step="0.000001"
                            className="ats-form-input"
                            placeholder="e.g. 6.524379"
                            value={manualCheckinForm.latitude}
                            onChange={(e) =>
                              setManualCheckinForm((f) => ({ ...f, latitude: e.target.value }))
                            }
                          />
                        </div>
                        <div className="ats-form-field">
                          <label className="ats-form-label">Longitude *</label>
                          <input
                            type="number"
                            step="0.000001"
                            className="ats-form-input"
                            placeholder="e.g. 3.379206"
                            value={manualCheckinForm.longitude}
                            onChange={(e) =>
                              setManualCheckinForm((f) => ({ ...f, longitude: e.target.value }))
                            }
                          />
                        </div>
                        <div className="ats-form-field">
                          <label className="ats-form-label">Accuracy (m)</label>
                          <input
                            type="number"
                            className="ats-form-input"
                            value={manualCheckinForm.accuracy}
                            onChange={(e) =>
                              setManualCheckinForm((f) => ({ ...f, accuracy: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="ats-form-actions">
                        <button
                          className="ats-action-btn ats-action-btn--confirm"
                          disabled={manualCheckinLoading}
                          onClick={() => handleManualCheckin(sheet)}
                        >
                          {manualCheckinLoading ? "Submitting…" : "Submit Check-In"}
                        </button>
                        <button
                          className="ats-action-btn ats-action-btn--cancel"
                          onClick={() => {
                            setManualCheckinId(null);
                            setManualCheckinForm({
                              latitude: "",
                              longitude: "",
                              accuracy: "50",
                              checkinTimestamp: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Visit metadata */}
                  <div className="ats-section">
                    <h5 className="ats-section-title">Visit Info</h5>
                    <div className="ats-checkin-detail">
                      {sheet.scheduledDate && (
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Scheduled date</span>
                          <span className="ats-checkin-val">
                            {formatWATDate(sheet.scheduledDate)}
                            {sheet.scheduledStartTime && sheet.scheduledEndTime &&
                              ` · ${formatTimeStr(sheet.scheduledStartTime)} – ${formatTimeStr(sheet.scheduledEndTime)}`}
                          </span>
                        </div>
                      )}
                      {sheet.submittedAt && (
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Submitted at</span>
                          <span className="ats-checkin-val">{formatWAT(sheet.submittedAt)}</span>
                        </div>
                      )}
                      {sheet.visitDurationMinutes != null && (
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Visit duration</span>
                          <span className="ats-checkin-val">
                            {formatDuration(sheet.visitDurationMinutes)}
                          </span>
                        </div>
                      )}
                      {sheet.clientReviewedAt && (
                        <div className="ats-checkin-row">
                          <span className="ats-checkin-key">Client reviewed at</span>
                          <span className="ats-checkin-val">
                            {formatWAT(sheet.clientReviewedAt)}
                          </span>
                        </div>
                      )}
                      <div className="ats-checkin-row">
                        <span className="ats-checkin-key">Sheet ID</span>
                        <span className="ats-checkin-val ats-mono">{sheet.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks summary */}
                  <div className="ats-section">
                    <h5 className="ats-section-title">
                      Tasks ({sheet.tasks?.length || 0})
                    </h5>
                    {sheet.tasks && sheet.tasks.length > 0 ? (
                      <ul className="ats-task-list">
                        {sheet.tasks.map((task, i) => (
                          <li
                            key={task.id || i}
                            className={`ats-task-item${task.completed ? " ats-task-item--done" : ""}`}
                          >
                            <span className="ats-task-check">{task.completed ? "✓" : "○"}</span>
                            <span className="ats-task-text">{task.text}</span>
                            {task.addedByCaregiver && (
                              <span className="ats-task-tag">caregiver</span>
                            )}
                            {task.addedByClient && (
                              <span className="ats-task-tag ats-task-tag--client">client</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ats-empty-text">No tasks on this sheet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTaskSheets;
