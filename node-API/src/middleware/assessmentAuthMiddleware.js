// src/middleware/assessmentAuthMiddleware.js
// Simplified authentication middleware just for assessment routes
// This will be replaced when the proper external API endpoint is available

/**
 * Simplified middleware for assessment routes
 * Just validates that there's an authorization header but doesn't verify with external API
 */
const assessmentAuth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, no token' 
      });
    }
    
    // Get userId from body or query
    const userId = req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required for authentication'
      });
    }
    
    // Set user object in request (simplified)
    req.user = { 
      id: userId,
      token: authHeader.split(' ')[1]
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = assessmentAuth;
