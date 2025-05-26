// src/middleware/authMiddleware.js
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// Protect middleware - Verifies user with external API
const protectUser = async (userId, token, userType = 'caregiver') => {
  const External_Auth_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
  try {
    if (!userId || !token) return null;

    // Determine the endpoint based on user type
    const endpoint = userType === 'client' 
      ? `${External_Auth_API}/Clients/${userId}`
      : `${External_Auth_API}/CareGivers/${userId}`;

    // Verify user through external API with token
    const externalResponse = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!externalResponse.data) return null; // Check if the response indicates success
    const user = externalResponse.data;
    // Add userType to the user object for later use
    user.userType = userType;

    // Return user data if verified
    return user;
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return null;
  }
};

// Express middleware for protecting routes
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Not authorized, no token' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Get userId from query params or body
    const userId = req.query.userId || req.body.userId;
    
    // Get userType from query params or body, default to 'caregiver'
    const userType = req.query.userType || req.body.userType || 'caregiver';
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID is required for authentication'
      });
    }
    
    // Verify user with the correct user type
    const user = await protectUser(userId, token, userType);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, invalid token or user ID'
      });
    }
    
    // Set user data in request for access in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

module.exports = { protectUser, protect };
