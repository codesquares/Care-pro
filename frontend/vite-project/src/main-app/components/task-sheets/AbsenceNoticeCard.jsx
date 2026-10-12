import { useState, useEffect, useCallback } from "react";
import CaregiverAssignmentService from "../../services/caregiverAssignmentService";

const ABSENCE_CATEGORIES = [
  { value: "illness", label: "Illness" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "transport", label: "Transport problem" },
  { value: "other", label: "Other" },
];

const STATUS_TEXT = {
  open: "Sent — CarePro will look at it",
  cover_arranged: "CarePro is arranging cover",
  credited: "CarePro has noted a credit",
  no_action_needed: "Noted by CarePro",
  closed: "Closed by CarePro",
  withdrawn: "Withdrawn",
};

const todayLagos = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

/**
 * Caregiver "I can't attend a day" notice for a package assignment. Informational: tells the client and
 * CarePro; no money moves and nothing is cancelled. A required reason CATEGORY is all the client sees —
 * the optional note is for CarePro staff only. Same-day / next-morning notices are marked short notice
 * (CarePro reviews those; it is only a flag).
 */
const AbsenceNoticeCard = ({ assignmentId }) => {
  const [notices, setNotices] = useState([]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayLagos());
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const load = useCallback(async () => {
    const r = await CaregiverAssignmentService.getAbsenceNotices(assignmentId);
    if (r.success) setNotices(r.data);
  }, [assignmentId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (sending) return;
    if (!category) { setError("Please choose a reason."); return; }
    setSending(true); setError(null); setSent(null);
    const r = await CaregiverAssignmentService.createAbsenceNotice(assignmentId, { date, category, note: note.trim() });
    setSending(false);
    if (!r.success) { setError(r.error); return; }
    setSent(r.data?.shortNotice
      ? "Notice sent. It was short notice, so CarePro will review it and be in touch."
      : "Notice sent. Your client and CarePro have been told.");
    setCategory(""); setNote(""); setOpen(false); load();
  };

  const withdraw = async (id) => {
    if (withdrawingId) return;
    setWithdrawingId(id); setError(null); setSent(null);
    const r = await CaregiverAssignmentService.withdrawAbsenceNotice(assignmentId, id);
    setWithdrawingId(null);
    if (!r.success) { setError(r.error); load(); return; }
    setSent("Notice withdrawn. Your client and CarePro have been told.");
    load();
  };

  return (
    <div className="asn-absence" data-testid="absence-notice-card">
      <h3>Can't attend a day?</h3>
      <p className="asn-visits-note">
        Tell your client and CarePro in advance. This is a notice only — nothing is charged, refunded or paid because of it.
        Your client sees the day and the reason category, not your note.
      </p>
      {sent && <p className="asn-brief-note" data-testid="absence-sent">{sent}</p>}
      {error && !open && <p className="error-message" data-testid="absence-error">{error}</p>}
      {!open ? (
        <button type="button" className="asn-btn" onClick={() => { setOpen(true); setSent(null); setError(null); }} data-testid="absence-open">
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
            <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="absence-category">
              <option value="">Choose a reason…</option>
              {ABSENCE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label>
            Note for CarePro (optional — your client won't see this)
            <textarea rows="3" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} data-testid="absence-note" />
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
            <li key={n.id} data-testid="absence-item">
              <strong>{fmtDay(n.date)}</strong>{n.shortNotice ? " (short notice)" : ""} — {n.categoryLabel}
              {" · "}<span data-testid="absence-item-status">{STATUS_TEXT[n.status] || n.status}</span>
              {n.canWithdraw && (
                <>{" "}
                  <button type="button" className="asn-btn" onClick={() => withdraw(n.id)} disabled={withdrawingId === n.id} data-testid="absence-withdraw">
                    {withdrawingId === n.id ? "Withdrawing…" : "Withdraw"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AbsenceNoticeCard;
