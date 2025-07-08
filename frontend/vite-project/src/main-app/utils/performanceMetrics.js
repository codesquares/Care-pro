/**
 * Performance metrics for tracking API call performance
 * This helper monitors API performance and helps identify bottlenecks
 */

// Configuration
const MAX_METRICS_PER_TYPE = 20; // Keep only the most recent metrics per type
const METRICS_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class PerformanceMetrics {
  constructor() {
    this.metrics = {};
    this.startTimes = {};
    this._lastCleanupTime = Date.now();
  }

  /**
   * Start timing an operation
   * @param {string} type - The operation type (e.g. 'api-call', 'render')
   * @param {string} name - The specific operation name
   */
  start(type, name) {
    const key = `${type}:${name}`;
    this.startTimes[key] = performance.now();
  }

  /**
   * End timing an operation and record its duration
   * @param {string} type - The operation type (e.g. 'api-call', 'render')
   * @param {string} name - The specific operation name
   * @param {boolean} success - Whether the operation succeeded
   * @param {Object} metadata - Additional data to store with the measurement
   */
  end(type, name, success = true, metadata = {}) {
    const key = `${type}:${name}`;
    const startTime = this.startTimes[key];
    
    if (!startTime) {
      console.warn(`No start time found for ${key}`);
      return;
    }
    
    const duration = performance.now() - startTime;
    delete this.startTimes[key];
    
    // Initialize metrics array for this type if it doesn't exist
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }
    
    // Add the new metric
    this.metrics[type].push({
      name,
      duration,
      timestamp: Date.now(),
      success,
      ...metadata
    });
    
    // Limit the number of metrics stored per type
    if (this.metrics[type].length > MAX_METRICS_PER_TYPE) {
      this.metrics[type] = this.metrics[type].slice(-MAX_METRICS_PER_TYPE);
    }
    
    // Cleanup periodically
    this._maybeCleanup();
    
    return duration;
  }

  /**
   * Get all metrics of a specific type
   * @param {string} type - The operation type to retrieve
   * @returns {Array} Array of metrics
   */
  getMetrics(type) {
    return this.metrics[type] || [];
  }

  /**
   * Get average duration for a specific operation
   * @param {string} type - The operation type
   * @param {string} name - The specific operation name (optional)
   * @returns {number} Average duration in milliseconds
   */
  getAverage(type, name = null) {
    const metrics = this.metrics[type] || [];
    
    const filteredMetrics = name 
      ? metrics.filter(m => m.name === name)
      : metrics;
      
    if (filteredMetrics.length === 0) {
      return 0;
    }
    
    const sum = filteredMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / filteredMetrics.length;
  }

  /**
   * Clean up old metrics
   * @private
   */
  _maybeCleanup() {
    const now = Date.now();
    
    // Only run cleanup every hour
    if (now - this._lastCleanupTime < 3600000) {
      return;
    }
    
    this._lastCleanupTime = now;
    
    // Remove old metrics
    Object.keys(this.metrics).forEach(type => {
      this.metrics[type] = this.metrics[type].filter(m => 
        now - m.timestamp < METRICS_TTL
      );
    });
  }

  /**
   * Create a timing helper that automatically starts and ends timing
   * @param {string} type - The operation type
   * @param {string} name - The operation name
   * @returns {Function} A function that ends the timing when called
   */
  time(type, name) {
    this.start(type, name);
    
    return (success = true, metadata = {}) => {
      return this.end(type, name, success, metadata);
    };
  }

  /**
   * Record an API call with timing
   * @param {string} method - HTTP method
   * @param {string} url - API URL
   * @param {Function} apiCall - The async API call to time
   * @returns {Promise} - The result of the API call
   */
  async timeApiCall(method, url, apiCall) {
    const endTimer = this.time('api-call', `${method} ${url}`);
    
    try {
      const result = await apiCall();
      endTimer(true, { status: result.status });
      return result;
    } catch (error) {
      endTimer(false, { error: error.message });
      throw error;
    }
  }
}

// Export singleton
export const performanceMetrics = new PerformanceMetrics();
export default performanceMetrics;
