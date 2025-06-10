/**
 * Chat System Logger
 * 
 * A utility for consistent logging in the chat system with severity levels,
 * context tracking, and grouping related logs for easier debugging.
 */

// Configuration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Default to INFO in production, DEBUG in development
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

class ChatLogger {
  constructor(module = 'chat', minLevel = DEFAULT_LOG_LEVEL) {
    this.module = module;
    this.minLevel = minLevel;
    this.sessionId = `chat-${Date.now().toString(36)}`;
  }

  /**
   * Format a log message with timestamp, module, and session info
   */
  _formatMessage(message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${this.module}:${this.sessionId}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Log a debug message
   */
  debug(message, data = null) {
    if (this.minLevel <= LOG_LEVELS.DEBUG) {
      console.debug(this._formatMessage(message, data));
    }
  }

  /**
   * Log an info message
   */
  info(message, data = null) {
    if (this.minLevel <= LOG_LEVELS.INFO) {
      console.info(this._formatMessage(message, data));
    }
  }

  /**
   * Log a warning message
   */
  warn(message, data = null) {
    if (this.minLevel <= LOG_LEVELS.WARN) {
      console.warn(this._formatMessage(message, data));
    }
  }

  /**
   * Log an error message
   */
  error(message, error = null) {
    if (this.minLevel <= LOG_LEVELS.ERROR) {
      if (error && error instanceof Error) {
        console.error(this._formatMessage(message), error);
      } else {
        console.error(this._formatMessage(message, error));
      }
    }
  }

  /**
   * Start a group of related logs
   */
  group(name) {
    if (console.groupCollapsed) {
      console.groupCollapsed(`[${this.module}:${this.sessionId}] ${name}`);
    }
  }

  /**
   * End a group of logs
   */
  groupEnd() {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log performance timing
   */
  time(label) {
    const fullLabel = `[${this.module}:${this.sessionId}] ${label}`;
    console.time(fullLabel);
    return () => console.timeEnd(fullLabel);
  }

  /**
   * Log network requests with performance data
   */
  logRequest(method, url, status, duration) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    
    if (this.minLevel <= level) {
      const message = `${method} ${url} ${status} (${duration}ms)`;
      
      if (status >= 400) {
        this.error(message);
      } else {
        this.info(message);
      }
    }
  }

  /**
   * Create a child logger for a specific submodule
   */
  child(submodule) {
    return new ChatLogger(`${this.module}:${submodule}`, this.minLevel);
  }
}

// Create default exports
export const chatLogger = new ChatLogger('chat-system');
export const connectionLogger = chatLogger.child('connection');
export const messageLogger = chatLogger.child('messages');
export const uiLogger = chatLogger.child('ui');

export default chatLogger;
