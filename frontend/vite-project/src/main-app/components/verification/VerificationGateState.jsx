/**
 * VerificationGateState
 *
 * Renders the non-eligible UI states returned by the Dojah verification
 * gate. Shared by the caregiver and client verification pages so the copy
 * stays consistent.
 *
 * Handled reasons (renders nothing for 'eligible' — the parent owns that):
 *   - already_verified     -> verified badge + optional onProceed CTA
 *   - pending_review       -> "under review" message
 *   - cooldown_active      -> live countdown to gate.cooldownUntil
 *   - max_attempts_reached -> contact-support message
 */

import { useEffect, useState } from 'react';

function formatRemaining(ms) {
  if (ms <= 0) return '0 seconds';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  // Show minutes whenever <1 day; show seconds only in the final minute.
  if (!days && minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if (!days && !hours && !minutes) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);
  return parts.join(' ');
}

function CooldownCountdown({ until, onExpire }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(until).getTime();
  const remaining = target - now;

  useEffect(() => {
    if (remaining <= 0 && typeof onExpire === 'function') {
      onExpire();
    }
  }, [remaining, onExpire]);

  return <strong>{formatRemaining(remaining)}</strong>;
}

export default function VerificationGateState({
  gate,
  onProceed,        // optional: e.g. navigate to assessments after already_verified
  proceedLabel = 'Continue',
  onCooldownExpire, // optional: refresh callback
}) {
  if (!gate) return null;

  switch (gate.reason) {
    case 'already_verified':
      return (
        <div className="verification-status verified">
          <h3>✅ Account Verified</h3>
          <p>Your identity has been successfully verified.</p>
          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              className="proceed-btn start-assessment"
            >
              {proceedLabel}
              <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
      );

    case 'pending_review':
      return (
        <div className="verification-status pending">
          <h3>⏳ Verification Under Review</h3>
          <p>
            Your verification is under review. We will notify you of the result
            as soon as it is available.
          </p>
        </div>
      );

    case 'cooldown_active':
      return (
        <div className="verification-status pending">
          <h3>⏳ Please Wait Before Retrying</h3>
          <p>
            You can retry verification in{' '}
            <CooldownCountdown
              until={gate.cooldownUntil}
              onExpire={onCooldownExpire}
            />
            .
          </p>
          {typeof gate.attemptsRemaining === 'number' && (
            <p className="pending-info">
              Attempts remaining: {gate.attemptsRemaining}
            </p>
          )}
        </div>
      );

    case 'max_attempts_reached':
      return (
        <div className="verification-status">
          <h3>🚫 Maximum Attempts Reached</h3>
          <p>
            You have reached the maximum number of verification attempts.
            Please contact support for assistance.
          </p>
        </div>
      );

    default:
      return null;
  }
}
