import { useState, useEffect } from "react";
import ClientPackageRequestService from "../../services/clientPackageRequestService";

const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

/** The client's list of "can't attend" notices from their caregiver. Renders nothing when there are none. */
const OUTCOME_TEXT = {
  cover_arranged: "CarePro is arranging cover for this day.",
  credited: "CarePro has noted a credit for this day.",
  withdrawn: "Withdrawn — your care for this day goes ahead as normal.",
};

const ClientAbsenceNotices = ({ packageRequestId }) => {
  const [notices, setNotices] = useState([]);
  useEffect(() => {
    let live = true;
    ClientPackageRequestService.getAbsenceNotices(packageRequestId).then((r) => {
      if (live && r.success) setNotices(r.data);
    });
    return () => { live = false; };
  }, [packageRequestId]);

  if (notices.length === 0) return null;
  return (
    <div className="pr-visits-card" data-testid="client-absence-notices">
      <h2>Notices from your caregiver</h2>
      <ul className="pr-visit-list">
        {notices.map((n) => (
          <li key={n.id} className="pr-visit-item">
            <strong>{fmtDay(n.date)}</strong>{n.shortNotice && n.outcome !== "withdrawn" ? " — short notice, CarePro is reviewing" : ""}
            <div data-testid="client-absence-category">Reason: {n.categoryLabel}</div>
            {n.outcome && <div data-testid="client-absence-outcome">{OUTCOME_TEXT[n.outcome]}</div>}
          </li>
        ))}
      </ul>
      <p className="pr-visit-meta">Our team will be in touch if anything needs arranging.</p>
    </div>
  );
};

export default ClientAbsenceNotices;
