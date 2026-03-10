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
      toast.error(result.error);
    }

    setLoading(false);
  };

  if (isCheckedIn) {
    const time = new Date(checkin.checkinTimestamp).toLocaleTimeString([], {
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

  return (
    <div className="checkin-section">
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
