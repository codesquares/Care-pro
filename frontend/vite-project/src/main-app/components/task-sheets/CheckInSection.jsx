import { useState } from "react";
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
  const checkin = sheet?.checkin || null;
  const isCheckedIn = !!checkin;

  const handleCheckin = async () => {
    if (loading || isCheckedIn || disabled) return;

    setLoading(true);

    // Step 1: Get GPS
    const gpsResult = await VisitCheckinService.getCurrentPosition();
    if (!gpsResult.success) {
      toast.error(gpsResult.error);
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

  return (
    <div className="checkin-section">
      <button
        className="checkin-btn"
        onClick={handleCheckin}
        disabled={loading || disabled}
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
    </div>
  );
};

export default CheckInSection;
