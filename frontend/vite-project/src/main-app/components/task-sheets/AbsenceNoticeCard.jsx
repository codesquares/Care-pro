import { useState, useEffect, useCallback } from "react";
import CaregiverAssignmentService from "../../services/caregiverAssignmentService";

const todayLagos = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

/**
 * Caregiver "I can't attend a day" notice for a package assignment. Informational: tells the client and
 * CarePro; no money moves and nothing is cancelled. Same-day / next-morning notices are marked short notice
 * (CarePro reviews those).
 */
const AbsenceNoticeCard = ({ assignmentId }) => {
  const [notices, setNotices] = useState([]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayLagos());
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  const load = useCallback(async () => {
    const r = await CaregiverAssignmentService.getAbsenceNotices(assignmentId);
    if (r.success) setNotices(r.data);
  }, [assignmentId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (sending) return;
    if (!reason.trim()) { setError("Please give a reason."); return; }
    setSending(true); setError(null); setSent(null);
    const r = await CaregiverAssignmentService.createAbsenceNotice(assignmentId, { date, reason: reason.trim() });
    setSending(false);
    if (!r.success) { setError(r.error); return; }
    setSent(r.data?.shortNotice
      ? "Notice sent. It was short notice, so CarePro will review it and be in touch."
      : "Notice sent. Your client and CarePro have been told.");
    setReason(""); setOpen(false); load();
  };

  return (
    <div className="asn-absence" data-testid="absence-notice-card">
      <h3>Can't attend a day?</h3>
      <p className="asn-visits-note">
        Tell your client and CarePro in advance. This is a notice only — nothing is charged, refunded or paid because of it.
      </p>
      {sent && <p className="asn-brief-note" data-testid="absence-sent">{sent}</p>}
      {!open ? (
        <button type="button" className="asn-btn" onClick={() => { setOpen(true); setSent(null); }} data-testid="absence-open">
          I can't attend a day
        </button>
      ) : (
        <div className="asn-absence-form">
          <label>
            Day
            <input type="date" value={date} min={todayLagos()} onChange={(e) => setDate(e.target.value)} data-testid="absence-date" />
          </label>
          <label>
            Reason
            <textarea rows="3" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="absence-reason" />
          </label>
          {error && <p className="error-message" data-testid="absence-error">{error}</p>}
          <div>
            <button type="button" className="asn-btn" onClick={() => setOpen(false)} disabled={sending}>Cancel</button>{" "}
            <button type="button" className="asn-btn asn-btn--primary" onClick={submit} disabled={sending} data-testid="absence-submit">
              {sending ? "Sending…" : "Send notice"}
            </button>
          </div>
        </div>
      )}
      {notices.length > 0 && (
        <ul className="asn-absence-list" data-testid="absence-list">
          {notices.map((n) => (
            <li key={n.id}>
              <strong>{fmtDay(n.date)}</strong>{n.shortNotice ? " (short notice)" : ""} — {n.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AbsenceNoticeCard;
