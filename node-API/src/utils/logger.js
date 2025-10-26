/**
 * Simple logger utility for test scripts
 */

class Logger {
  constructor(namespace) {
    this.namespace = namespace || 'app';
  }
  
  info(message) {
    console.log(`[INFO][${this.namespace}] ${message}`);
  }
  
  error(message) {
    console.error(`[ERROR][${this.namespace}] ${message}`);
  }
  
  warn(message) {
    console.warn(`[WARN][${this.namespace}] ${message}`);
  }
  
  debug(message) {
    if (process.env.DEBUG) {
      console.log(`[DEBUG][${this.namespace}] ${message}`);
    }
  }
}

// Create a default logger instance
const defaultLogger = new Logger();

// Export a function to create namespaced loggers
const createLogger = (namespace) => new Logger(namespace);

// Export both the default logger and the createLogger function
module.exports = {
  ...defaultLogger,
  createLogger
};
