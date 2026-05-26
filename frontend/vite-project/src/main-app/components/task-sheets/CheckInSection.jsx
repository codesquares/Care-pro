import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import VisitCheckinService from "../../services/visitCheckinService";

/**
 * CheckInSection — GPS check-in bar displayed at the top of a visit sheet.
 *
 * Props:
 *  - sheet: task sheet object (must include .checkin if already checked in)
 *  - orderId: the order ID
 *  - onCheckedIn(checkinData): callback after successful check-in
 *  - disabled: if true, check-in is not allowed (e.g. order completed)
 */
const CheckInSection = ({ sheet, orderId, onCheckedIn, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const checkin = sheet?.checkin || null;
  const isCheckedIn = !!checkin;

  // Proactively request location permission when the component mounts
  // so the browser prompt appears immediately for the caregiver
  useEffect(() => {
    if (isCheckedIn || disabled) return;

    let cancelled = false;

    (async () => {
      const permState = await VisitCheckinService.checkPermission();
      if (cancelled || permState === "unsupported" || permState === "denied") return;

      if (permState === "prompt") {
        // Trigger the browser permission prompt by requesting position
        // We discard the result — this is only to surface the prompt early
        navigator.geolocation.getCurrentPosition(
          () => {},
          (err) => {
            // If user denies, show the permission guide
            if (!cancelled && err.code === err.PERMISSION_DENIED) {
              setShowPermissionGuide(true);
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    })();

    return () => { cancelled = true; };
  }, [isCheckedIn, disabled]);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleCheckin = async () => {
    if (loading || isCheckedIn || disabled) return;

    setScheduleError(null);
    setLoading(true);

    // Pre-check permission state
    const permState = await VisitCheckinService.checkPermission();
    if (permState === "unsupported") {
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    if (permState === "denied") {
      setShowPermissionGuide(true);
      setLoading(false);
      return;
    }

    // Step 1: Get GPS (will trigger browser prompt if state is "prompt")
    const gpsResult = await VisitCheckinService.getCurrentPosition();
    if (!gpsResult.success) {
      if (gpsResult.permissionDenied) {
        setShowPermissionGuide(true);
      } else {
        toast.error(gpsResult.error);
      }
      setLoading(false);
      return;
    }

    // Step 2: Submit check-in
    const result = await VisitCheckinService.checkin({
      taskSheetId: sheet.id,
      orderId,
      latitude: gpsResult.coords.latitude,
      longitude: gpsResult.coords.longitude,
      accuracy: gpsResult.coords.accuracy,
    });

    if (result.success) {
      const msg = result.data.alreadyCheckedIn
        ? "Already checked in for this visit."
        : "Checked in successfully!";
      toast.success(msg);
      if (onCheckedIn) onCheckedIn(result.data);
    } else {
      // Show contextual messages for structured check-in error codes
      switch (result.errorCode) {
        case "PROXIMITY_TOO_FAR":
          toast.error(
            `You are ${Math.round(result.distanceMeters)}m away from the service address. ` +
            `You need to be within ${result.maxDistanceMeters}m to check in.`
          );
          break;
        case "OUTSIDE_SCHEDULE": {
          const isClosed = result.error && result.error.toLowerCase().includes("closed at");
          setScheduleError({
            type: isClosed ? "closed" : "early",
            scheduledStartTime: result.scheduledStartTime,
            scheduledEndTime: result.scheduledEndTime,
            currentTimeNigeria: result.currentTimeNigeria,
            errorMessage: result.error,
          });
          break;
        }
        case "NOT_SCHEDULED_TODAY":
          toast.error(
            `No visit is scheduled for today. Your next scheduled day is ${result.scheduledDay}.`
          );
          break;
        case "NO_APPROVED_CONTRACT":
          toast.error("No approved contract found for this order. Please contact the client.");
          break;
        case "NO_GEOCODED_ADDRESS":
          toast.error("The service address has not been set up yet. Please ask the client to update their address.");
          break;
        case "TASKSHEET_CANCELLED":
          toast.error("This visit has been cancelled by the client.");
          break;
        default:
          toast.error(result.error);
      }
    }

    setLoading(false);
  };

  if (isCheckedIn) {
    const time = new Date(checkin.checkinTimestamp).toLocaleTimeString("en-NG", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
    });
    const distance = VisitCheckinService.formatDistance(checkin.distanceFromServiceAddress);

    return (
      <div className="checkin-section checkin-section--done">
        <div className="checkin-status">
          <span className="checkin-icon">📍</span>
          <div className="checkin-info">
            <span className="checkin-label">Checked In</span>
            <span className="checkin-time">Arrived at {time}</span>
            {checkin.distanceFromServiceAddress != null && (
              <span className="checkin-distance">{distance} from service address</span>
            )}
          </div>
        </div>
        {checkin.isLateCheckin && (
          <div className="checkin-late-banner">
            <span className="checkin-late-icon">⚠️</span>
            <span className="checkin-late-text">
              You checked in {checkin.minutesLate} minute{checkin.minutesLate !== 1 ? "s" : ""} after the scheduled start time. This has been recorded.
            </span>
          </div>
        )}
      </div>
    );
  }

  // Hard-closed check-in window — show a serious state with no retry button
  if (scheduleError?.type === "closed") {
    return (
      <div className="checkin-section checkin-section--closed">
        <div className="checkin-status">
          <span className="checkin-icon">🔒</span>
          <div className="checkin-info">
            <span className="checkin-label checkin-label--closed">Check-in Window Closed</span>
            <span className="checkin-schedule-msg">{scheduleError.errorMessage}</span>
            <span className="checkin-support-prompt">Please contact support to record this visit.</span>
          </div>
        </div>
      </div>
    );
  }

  // Sheet was submitted without a check-in — show an informative state, not a disabled button
  if (disabled) {
    return (
      <div className="checkin-section checkin-section--missed">
        <div className="checkin-status">
          <span className="checkin-icon">📍</span>
          <div className="checkin-info">
            <span className="checkin-label">Not Checked In</span>
            <span className="checkin-hint">Check-in was not recorded for this visit.</span>
          </div>
        </div>
      </div>
    );
  }

  // Check-in window guard.
  // If the sheet has a scheduled date + start time, check-in is allowed from 1 hour before
  // the start time up to 2 hours after the start time (all times in Nigerian time, WAT UTC+1).
  // If only a date is known (no start time), fall back to a date-only check.
  // Legacy sheets with no scheduledDate skip this guard entirely.
  const scheduledDateStr = sheet?.scheduledDate ? sheet.scheduledDate.split("T")[0] : null;
  const scheduledStartTimeStr = sheet?.scheduledStartTime || null; // "HH:mm" in WAT

  if (scheduledDateStr && scheduledStartTimeStr) {
    const [startH, startM] = scheduledStartTimeStr.split(":").map(Number);
    // Construct the scheduled start as a UTC timestamp (WAT = UTC+1, so use +01:00 offset)
    const scheduledStartMs = new Date(
      `${scheduledDateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00+01:00`
    ).getTime();
    const windowOpenMs  = scheduledStartMs - 60 * 60 * 1000;       // 1 hour before
    const windowCloseMs = scheduledStartMs + 2 * 60 * 60 * 1000;   // 2 hours after
    const nowMs = Date.now();

    if (nowMs < windowOpenMs) {
      const openTimeStr = new Date(windowOpenMs).toLocaleTimeString("en-NG", {
        timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit",
      });
      const openDateStr = new Date(windowOpenMs).toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos", weekday: "long", month: "long", day: "numeric",
      });
      return (
        <div className="checkin-section checkin-section--wrong-date">
          <div className="checkin-status">
            <span className="checkin-icon">⏰</span>
            <div className="checkin-info">
              <span className="checkin-label">Check-in Not Yet Available</span>
              <span className="checkin-hint">
                Check-in opens at {openTimeStr} (WAT) on {openDateStr}.
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (nowMs > windowCloseMs) {
      const closeTimeStr = new Date(windowCloseMs).toLocaleTimeString("en-NG", {
        timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit",
      });
      return (
        <div className="checkin-section checkin-section--missed">
          <div className="checkin-status">
            <span className="checkin-icon">🔒</span>
            <div className="checkin-info">
              <span className="checkin-label">Check-in Window Closed</span>
              <span className="checkin-hint">
                The check-in window closed at {closeTimeStr} (WAT). Please contact support to record this visit.
              </span>
            </div>
          </div>
        </div>
      );
    }

    // nowMs is within the window — fall through to show the button

  } else if (scheduledDateStr) {
    // Date-only fallback (no start time available)
    const todayNigeria = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    if (todayNigeria !== scheduledDateStr) {
      const isPast = todayNigeria > scheduledDateStr;
      const formattedDate = new Date(`${scheduledDateStr}T12:00:00+01:00`).toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos", weekday: "long", month: "long", day: "numeric",
      });
      return (
        <div className="checkin-section checkin-section--wrong-date">
          <div className="checkin-status">
            <span className="checkin-icon">📅</span>
            <div className="checkin-info">
              <span className="checkin-label">
                {isPast ? "Visit Date Has Passed" : "Check-in Not Yet Available"}
              </span>
              <span className="checkin-hint">
                {isPast
                  ? `This visit was scheduled for ${formattedDate}. Check-in is no longer available.`
                  : `Check-in opens on ${formattedDate}.`}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="checkin-section">
      {scheduleError?.type === "early" && (
        <div className="checkin-early-notice">
          <span className="checkin-early-icon">⏰</span>
          <div className="checkin-early-body">
            <strong>You&apos;re a bit early!</strong>
            <p>{scheduleError.errorMessage}</p>
          </div>
        </div>
      )}
      <button
        className="checkin-btn"
        onClick={handleCheckin}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="checkin-spinner" />
            Getting location...
          </>
        ) : (
          <>
            <span className="checkin-icon">📍</span>
            Check In at Location
          </>
        )}
      </button>
      <p className="checkin-hint">
        Capture your GPS location when you arrive at the client's home.
      </p>

      {showPermissionGuide && (
        <div className="checkin-permission-overlay" onClick={() => setShowPermissionGuide(false)}>
          <div className="checkin-permission-guide" onClick={(e) => e.stopPropagation()}>
            <h3>📍 Location Permission Required</h3>
            <p>Location access is blocked. Please enable it to check in:</p>

            {isMobile ? (
              <div className="checkin-permission-steps">
                <p><strong>On iPhone (Safari):</strong></p>
                <ol>
                  <li>Go to <strong>Settings → Privacy → Location Services</strong></li>
                  <li>Find <strong>Safari</strong> and set to <strong>While Using</strong></li>
                  <li>Return here and tap Check In again</li>
                </ol>
                <p><strong>On Android (Chrome):</strong></p>
                <ol>
                  <li>Tap the <strong>lock icon</strong> (🔒) in the address bar</li>
                  <li>Tap <strong>Permissions → Location</strong></li>
                  <li>Set to <strong>Allow</strong></li>
                  <li>Refresh the page and tap Check In again</li>
                </ol>
              </div>
            ) : (
              <div className="checkin-permission-steps">
                <p><strong>In Chrome / Edge:</strong></p>
                <ol>
                  <li>Click the <strong>lock icon</strong> (🔒) in the address bar</li>
                  <li>Find <strong>Location</strong> and set to <strong>Allow</strong></li>
                  <li>Refresh the page and click Check In again</li>
                </ol>
                <p><strong>In Firefox:</strong></p>
                <ol>
                  <li>Click the <strong>lock icon</strong> (🔒) in the address bar</li>
                  <li>Click <strong>Clear permission</strong> next to Location</li>
                  <li>Refresh the page and click Check In again</li>
                </ol>
              </div>
            )}

            <div className="checkin-permission-actions">
              <button
                className="checkin-btn"
                onClick={() => {
                  setShowPermissionGuide(false);
                  handleCheckin();
                }}
              >
                🔄 Try Again
              </button>
              <button
                className="checkin-permission-dismiss"
                onClick={() => setShowPermissionGuide(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInSection;
