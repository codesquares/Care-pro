/**
 * Error Handler Utility
 * 
 * Standardized error handling for API responses
 */

const logger = require('./logger');

// Create a namespaced logger
const errorLogger = logger.createLogger('error-handler');

/**
 * Handle API errors in a standard way
 * 
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if error doesn't have one
 * @returns {Object} - Express response with appropriate status and message
 */
const handleError = (res, error, defaultMessage = 'An unexpected error occurred') => {
  // Log the full error for debugging
  errorLogger.error(`API Error: ${error.message}`, error);
  
  // Check if it's an Axios error with response data
  if (error.response) {
    // Return the status code from the upstream API if available
    const status = error.response.status || 500;
    const message = (error.response.data && error.response.data.message) || 
                    error.message || 
                    defaultMessage;
    
    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Handle different types of errors with appropriate status codes
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: error.message || 'Resource not found',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Default to 500 for unexpected errors
  return res.status(500).json({
    success: false,
    message: error.message || defaultMessage,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

module.exports = {
  handleError
};
