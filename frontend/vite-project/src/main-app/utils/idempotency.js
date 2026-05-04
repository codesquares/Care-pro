/**
 * Idempotency-Key helpers for signup endpoints.
 *
 * Backend contract (signup endpoints only):
 *   POST /api/CareGivers/AddCaregiverUser
 *   POST /api/CareGivers/GoogleSignUp
 *   POST /api/Clients/AddClientUser
 *   POST /api/Clients/GoogleSignUp
 *
 * - Send a fresh UUID v4 in the `Idempotency-Key` header per user-initiated
 *   submission. Reuse the same key for automatic retries (5xx, network, 409
 *   "still being processed"). Generate a new key only when the user explicitly
 *   re-submits.
 * - 409 "still being processed" -> wait briefly, retry with same key.
 * - 409 "has expired"           -> regenerate key, retry once.
 * - 422 "different endpoint" / 400 "Invalid Idempotency-Key" -> client bug,
 *   do NOT retry.
 */

/**
 * Generate a UUID v4 suitable for the Idempotency-Key header.
 * Falls back to a Math.random based v4-shaped string if crypto.randomUUID
 * is unavailable (older browsers / non-secure contexts).
 *
 * @returns {string}
 */
export function createIdempotencyKey() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to fallback
  }
  // RFC4122 v4 fallback
  const rnd = (n) => {
    const bytes = new Uint8Array(n);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  };
  const b = rnd(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return (
    `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-` +
    `${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-` +
    `${hex.slice(10, 16).join("")}`
  );
}

const STILL_PROCESSING_RE = /still being processed/i;
const EXPIRED_RE = /has expired/i;
const DIFFERENT_ENDPOINT_RE = /different endpoint/i;
const INVALID_KEY_RE = /invalid idempotency-key/i;

/**
 * Inspect an error/response shape to classify the idempotency outcome.
 * Accepts either an axios-style error (err.response.status, err.response.data.message
 * or .Message) or a plain object { status, message } returned by fetch wrappers.
 *
 * @param {unknown} err
 * @returns {"still-processing" | "expired" | "different-endpoint" | "invalid-key" | null}
 */
export function classifyIdempotencyError(err) {
  let status;
  let message = "";
  if (err && typeof err === "object") {
    const e = /** @type {any} */ (err);
    status = e.response?.status ?? e.status;
    message =
      e.response?.data?.Message ??
      e.response?.data?.message ??
      e.data?.Message ??
      e.data?.message ??
      e.message ??
      "";
  }
  if (status === 409 && STILL_PROCESSING_RE.test(message)) return "still-processing";
  if (status === 409 && EXPIRED_RE.test(message)) return "expired";
  if (status === 422 && DIFFERENT_ENDPOINT_RE.test(message)) return "different-endpoint";
  if (status === 400 && INVALID_KEY_RE.test(message)) return "invalid-key";
  return null;
}

/**
 * Run a signup submission with idempotency-aware retry handling.
 *
 *   const keyRef = useRef(null);
 *   await submitSignupWithIdempotency(keyRef, (key) => fetchData(payload, endpoint, {
 *     headers: { "Idempotency-Key": key },
 *   }));
 *
 * - Generates a new key into keyRef.current if one isn't already set
 *   (so caller can pre-set keyRef.current for an explicit re-submit).
 * - On 409 "still being processed": waits ~1.5s and retries with the SAME key,
 *   up to `maxStillProcessingRetries` times.
 * - On 409 "has expired": regenerates the key once and retries.
 * - On 422 "different endpoint" / 400 invalid key: rethrows immediately.
 * - On any other error: rethrows (caller decides what to do).
 *
 * @template T
 * @param {{ current: string | null }} keyRef
 * @param {(key: string) => Promise<T>} submitFn
 * @param {{ maxStillProcessingRetries?: number, stillProcessingDelayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
export async function submitSignupWithIdempotency(keyRef, submitFn, opts = {}) {
  const maxStill = opts.maxStillProcessingRetries ?? 3;
  const delay = opts.stillProcessingDelayMs ?? 1500;
  let stillTries = 0;
  let expiredRetried = false;

  if (!keyRef.current) keyRef.current = createIdempotencyKey();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await submitFn(keyRef.current);
    } catch (err) {
      const kind = classifyIdempotencyError(err);
      if (kind === "still-processing" && stillTries < maxStill) {
        stillTries += 1;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (kind === "expired" && !expiredRetried) {
        expiredRetried = true;
        keyRef.current = createIdempotencyKey();
        continue;
      }
      // different-endpoint / invalid-key / anything else -> bubble up
      throw err;
    }
  }
}
