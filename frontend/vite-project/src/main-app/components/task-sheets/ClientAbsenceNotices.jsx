import { useState, useEffect } from "react";
import ClientPackageRequestService from "../../services/clientPackageRequestService";

const fmtDay = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

/** The client's list of "can't attend" notices from their caregiver. Renders nothing when there are none. */
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
            <strong>{fmtDay(n.date)}</strong>{n.shortNotice ? " — short notice, CarePro is reviewing" : ""}
            <div>{n.reason}</div>
          </li>
        ))}
      </ul>
      <p className="pr-visit-meta">No charge or refund results from these notices.</p>
    </div>
  );
};

export default ClientAbsenceNotices;
