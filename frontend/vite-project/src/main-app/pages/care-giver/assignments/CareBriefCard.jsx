// Staff-written care brief shown on the offer card / assignment detail. Renders nothing when the
// assignment has no brief (older assignments) — a missing brief is never an error.
const Row = ({ label, children }) => (
  <div className="asn-brief-row"><span className="asn-brief-label">{label}</span><span>{children}</span></div>
);

const CareBriefCard = ({ brief, compact = false }) => {
  if (!brief) return null;
  const { careNeedsSummary, schedule, startDate, duration, area } = brief;
  if (!careNeedsSummary && !schedule && !startDate && !duration && !area) return null;
  return (
    <div className={`asn-brief${compact ? " asn-brief--compact" : ""}`} data-testid="care-brief" onClick={(e) => e.stopPropagation()}>
      {!compact && <h2>Care brief</h2>}
      {careNeedsSummary && <p className="asn-brief-needs">{careNeedsSummary}</p>}
      {schedule && <Row label="Schedule">{schedule}</Row>}
      {startDate && <Row label="Start date">{new Date(startDate).toLocaleDateString(undefined, { timeZone: "UTC" })}</Row>}
      {duration && <Row label="Duration">{duration}</Row>}
      {area && <Row label="Area">{area}</Row>}
    </div>
  );
};

export default CareBriefCard;
