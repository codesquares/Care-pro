/**
 * Contract-related deadlines are always shown in Africa/Lagos (WAT, UTC+1), whatever the viewer's browser
 * time zone is, so one deadline reads identically in the PDF, the email and every screen.
 * Stored/transported values stay UTC ISO strings; this is display only.
 * Mirrors the backend helper Application.Content.LagosTime.
 */
const ZONE = "Africa/Lagos";

const toDate = (value) => {
  if (value instanceof Date) return value;
  const s = String(value);
  // A timestamp without an offset would be read as the viewer's local time; the API always means UTC.
  return new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}Z`);
};

/** e.g. "Friday, 9 October 2026 at 8:51 AM WAT" */
export const formatLagos = (value) => {
  if (!value) return "";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const get = (locale, opts) => Object.fromEntries(
    new Intl.DateTimeFormat(locale, { timeZone: ZONE, ...opts }).formatToParts(d).map((p) => [p.type, p.value])
  );
  // Date in en-GB ("9 October 2026"); clock in en-US so midnight reads "12:30 AM" (en-GB would print "0:30"),
  // matching the backend format exactly.
  const date = get("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const clock = get("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const period = String(clock.dayPeriod || "").toUpperCase();
  return `${date.weekday}, ${date.day} ${date.month} ${date.year} at ${clock.hour}:${clock.minute} ${period} WAT`;
};

export default formatLagos;
