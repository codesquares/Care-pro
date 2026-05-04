import * as signalR from '@microsoft/signalr';
import config from '../config';

const HUB_URL = (() => {
  const base = config.FALLBACK_URL;
  if (!base || (!base.startsWith('http://') && !base.startsWith('https://'))) {
    console.error('[SignalRNotification] Invalid base URL:', base);
    return null;
  }
  return `${base}/notificationHub`;
})();

class SignalRNotificationService {
  constructor() {
    this.connection = null;
    this._isConnecting = false;
    this._userId = null;
    this._onNotification = null;
    this._onUnreadCountChanged = null;
    this._onVerificationStatusChanged = null;
  }

  /**
   * Register a callback for incoming notifications.
   */
  onNotification(callback) {
    this._onNotification = callback;
  }

  /**
   * Register a callback for unread-count changes.
   */
  onUnreadCountChanged(callback) {
    this._onUnreadCountChanged = callback;
  }

  /**
   * Register a callback for verification status changes (Dojah webhook results).
   * Payload: { userId, verificationStatus, isVerified, verificationMethod, timestamp }
   *
   * `verificationStatus` is one of (lowercase): 'success' | 'pending' | 'failed'.
   *  - success: verification passed; isVerified will be true.
   *  - pending: still in flow (Dojah Pending/Processing/Ongoing); isVerified false.
   *  - failed:  verification failed OR widget abandoned (Dojah Failed/Cancelled/Abandoned); isVerified false.
   *
   * Compare case-insensitively to be safe. There is no separate 'abandoned' status —
   * abandoned sessions arrive as 'failed'. Trust `isVerified` directly.
   */
  onVerificationStatusChanged(callback) {
    this._onVerificationStatusChanged = callback;
  }

  /**
   * Connect to the notification hub.
   * @param {string} token - JWT auth token
   * @param {string} userId - current user id
   */
  async connect(token, userId) {
    if (!HUB_URL) {
      console.warn('[SignalRNotification] No hub URL – skipping connection');
      return;
    }
    if (this._isConnecting || this.isConnected()) return;

    this._isConnecting = true;
    this._userId = userId;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this._setupHandlers();

      await this.connection.start();

      // Tell the hub which user we are
      try {
        await this.connection.invoke('RegisterConnection', userId);
      } catch {
        // Backend method might not exist yet – non-fatal
      }
    } catch (err) {
      console.error('[SignalRNotification] Connection failed:', err);
    } finally {
      this._isConnecting = false;
    }
  }

  _setupHandlers() {
    const conn = this.connection;

    // The hub pushes a new notification
    conn.on('ReceiveNotification', (notification) => {
      this._onNotification?.(notification);
    });

    // The hub pushes an updated unread count
    conn.on('UnreadCountChanged', (count) => {
      this._onUnreadCountChanged?.(count);
    });

    // The hub pushes a verification status update (from Dojah webhook)
    conn.on('VerificationStatusChanged', (data) => {
      this._onVerificationStatusChanged?.(data);
    });

    conn.onreconnected(() => {
      // Re-register after reconnect
      if (this._userId) {
        conn.invoke('RegisterConnection', this._userId).catch(() => {});
      }
    });
  }

  isConnected() {
    return (
      this.connection?.state === signalR.HubConnectionState.Connected
    );
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
      this._userId = null;
    }
  }
}

// Singleton
const signalRNotificationService = new SignalRNotificationService();
export default signalRNotificationService;
