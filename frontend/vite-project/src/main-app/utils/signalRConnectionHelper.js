/**
 * SignalR Connection Helper
 * Provides a reliable connection management layer for SignalR
 */

export class SignalRConnectionHelper {
  constructor() {
    this.connectionState = 'disconnected';
    this.lastConnectionAttempt = 0;
    this.connectionAttemptTimeout = 10000; // 10 seconds between attempts
    this.maxRetries = 3;
    this.currentRetries = 0;
  }

  /**
   * Check if enough time has passed since last connection attempt
   */
  canAttemptConnection() {
    const now = Date.now();
    return (now - this.lastConnectionAttempt) >= this.connectionAttemptTimeout;
  }

  /**
   * Mark connection attempt
   */
  markConnectionAttempt() {
    this.lastConnectionAttempt = Date.now();
    this.currentRetries++;
  }

  /**
   * Reset retry counter
   */
  resetRetries() {
    this.currentRetries = 0;
  }

  /**
   * Check if max retries reached
   */
  hasMaxRetriesReached() {
    return this.currentRetries >= this.maxRetries;
  }

  /**
   * Update connection state
   */
  updateConnectionState(state) {
    this.connectionState = state;
    if (state === 'connected') {
      this.resetRetries();
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }
}

export default new SignalRConnectionHelper();