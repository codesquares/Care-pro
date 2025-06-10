/**
 * ConnectionManager for SignalR
 * 
 * This utility helps manage SignalR connections to prevent multiple simultaneous
 * connections and reconnection loops.
 */

// Singleton to track global connection state
class ConnectionManager {
  constructor() {
    this.connectionAttemptInProgress = false;
    this.hasInitialized = false;
    this.connectionId = null;
    this.timeoutId = null;
    this.isDestroyed = false;
  }
  
  /**
   * Mark the start of a connection attempt
   * @returns {boolean} true if this is the first/only connection attempt, false if another is in progress
   */
  startConnectionAttempt() {
    if (this.connectionAttemptInProgress) {
      console.warn('[ConnectionManager] Connection attempt already in progress');
      return false;
    }
    
    this.connectionAttemptInProgress = true;
    return true;
  }
  
  /**
   * Mark the end of a connection attempt
   * @param {string} connectionId - The ID of the established connection, or null if failed
   */
  endConnectionAttempt(connectionId = null) {
    this.connectionAttemptInProgress = false;
    this.connectionId = connectionId;
    this.hasInitialized = !!connectionId;
  }
  
  /**
   * Set a timeout for a connection attempt
   * @param {Function} timeoutCallback - Function to call if timeout occurs
   * @param {number} timeoutMs - Timeout duration in milliseconds
   */
  setConnectionTimeout(timeoutCallback, timeoutMs = 15000) {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      timeoutCallback();
      this.connectionAttemptInProgress = false;
    }, timeoutMs);
  }
  
  /**
   * Clear any pending connection timeout
   */
  clearConnectionTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  /**
   * Reset the connection state
   */
  reset() {
    this.connectionAttemptInProgress = false;
    this.hasInitialized = false;
    this.connectionId = null;
    this.clearConnectionTimeout();
  }
  
  /**
   * Mark the manager as destroyed (e.g., component unmounted)
   */
  destroy() {
    this.isDestroyed = true;
    this.reset();
  }
  
  /**
   * Check if this manager has been destroyed
   * @returns {boolean}
   */
  isActive() {
    return !this.isDestroyed;
  }
}

// Create a singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager;
