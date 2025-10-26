/**
 * Middleware to validate API key for API-to-API communication
 * This is specifically for authentication between our service and the Azure API
 */
const apiKeyAuth = (req, res, next) => {
  try {
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.split(' ')[1];
    
    if (!apiKey) {
      return res.status(401).json({
        status: 'error',
        message: 'API key is required'
      });
    }
    
    // Validate against environment variable
    if (apiKey !== process.env.API_KEY && 
        apiKey !== `ApiKey ${process.env.API_KEY}`) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key'
      });
    }
    
    // If we reach here, API key is valid
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'API key authentication error'
    });
  }
};

module.exports = { apiKeyAuth };
