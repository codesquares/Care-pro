import config from '../config';

// ── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── VAPID key (cached per session) ───────────────────────────────────────────

const VAPID_CACHE_KEY = 'carepro_vapid_pk';

async function fetchVapidPublicKey() {
  const cached = sessionStorage.getItem(VAPID_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(`${config.BASE_URL}/push/vapid-public-key`);
  if (res.status === 503) return null; // Push not configured in this environment
  if (!res.ok) throw new Error(`VAPID key fetch failed: ${res.status}`);

  const { publicKey } = await res.json();
  if (publicKey) sessionStorage.setItem(VAPID_CACHE_KEY, publicKey);
  return publicKey;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe the current device to push notifications and POST the subscription
 * to the backend. Requires Notification.permission === 'granted' and a valid JWT.
 * Returns the PushSubscription object, or null if push is not supported/configured.
 */
export async function subscribeForPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return null;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const token = localStorage.getItem('authToken');
  const res = await fetch(`${config.BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: arrayBufferToBase64Url(sub.getKey('p256dh')),
      auth: arrayBufferToBase64Url(sub.getKey('auth')),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    }),
  });

  if (!res.ok) throw new Error(`Subscribe POST failed: ${res.status}`);
  return sub;
}

/**
 * Unsubscribe the current device from push notifications and DELETE the record
 * from the backend. Accepts an explicit token so it can be called safely before
 * localStorage is cleared during logout.
 */
export async function unsubscribeFromPush(token) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const authToken = token || localStorage.getItem('authToken');
    if (authToken) {
      await fetch(`${config.BASE_URL}/push/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
    await sub.unsubscribe();
  } catch (err) {
    console.warn('[PushService] Unsubscribe error:', err);
  }
}

/**
 * Returns the current push notification state for rendering the settings UI.
 * State machine: supported / permission / isSubscribed
 */
export async function getSubscriptionState() {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return { supported: false, permission: 'denied', isSubscribed: false };
  }
  const permission = Notification.permission; // 'default' | 'granted' | 'denied'
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return { supported: true, permission, isSubscribed: !!sub };
}
