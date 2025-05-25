// src/middleware/authMiddleware.js
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// Protect middleware - Verifies user with external API
const protectUser = async (userId, token, userType = 'caregiver') => {
  const External_Auth_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
  
  // Development mode bypass for testing
  const devMode = process.env.NODE_ENV !== 'production';
  if (devMode && process.env.BYPASS_AUTH === 'true') {
    console.log(`⚠️ AUTH BYPASS ENABLED: Using mock ${userType} data for userId: ${userId}`);
    
    // Make a more tailored mock user data based on userType
    const mockData = {
      id: userId,
      userType: userType, 
      firstName: userType === 'client' ? 'Client' : 'CareGiver',
      lastName: 'User',
      email: `${userType}@example.com`,
      isVerified: true,
      _devMode: true // Flag to indicate this is a mock user
    };
    
    // Log the mock data we're returning for debugging
    console.log('Mock user data:', mockData);
    
    return mockData;
  }
  
  try {
    if (!userId || !token) {
      console.log('❌ Missing userId or token');
      return null;
    }

    console.log(`🔍 Verifying user with type: ${userType}, userId: ${userId}`);
    
    // Attempt to verify both user types if inconsistent data is received
    let user = null;
    let errors = [];
    
    // Try the specified userType first
    try {
      // Determine the endpoint based on user type
      const endpoint = userType === 'client' 
        ? `${External_Auth_API}/Clients/${userId}`
        : `${External_Auth_API}/CareGivers/${userId}`;
        
      console.log(`📡 Trying endpoint: ${endpoint}`);

      // Verify user through external API with token
      const externalResponse = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (externalResponse.data) {
        user = externalResponse.data;
        user.userType = userType;
        console.log(`✅ User verified as ${userType}`);
      }
    } catch (primaryError) {
      errors.push({type: userType, error: primaryError.message});
      console.log(`❌ Failed to verify as ${userType}: ${primaryError.message}`);
      
      // If first attempt fails, try the alternative user type as fallback
      try {
        const alternativeType = userType === 'client' ? 'caregiver' : 'client';
        const alternativeEndpoint = alternativeType === 'client' 
          ? `${External_Auth_API}/Clients/${userId}`
          : `${External_Auth_API}/CareGivers/${userId}`;
          
        console.log(`📡 Trying alternative endpoint: ${alternativeEndpoint}`);
        
        const alternativeResponse = await axios.get(alternativeEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (alternativeResponse.data) {
          user = alternativeResponse.data;
          user.userType = alternativeType;
          console.log(`✅ User verified as ${alternativeType} (alternative type)`);
        }
      } catch (fallbackError) {
        errors.push({type: userType === 'client' ? 'caregiver' : 'client', error: fallbackError.message});
        console.log(`❌ Alternative verification also failed: ${fallbackError.message}`);
      }
    }
    
    // If we found a user with either method, return it
    if (user) {
      return user;
    }
    
    // If we reach here, both attempts failed
    console.error('❌ Authentication failed for both user types:', errors);
    return null;
  } catch (error) {
    console.error('❌ Authentication Error:', error.message);
    return null;
  }
};

// Express middleware for protecting routes
const protect = async (req, res, next) => {
  try {
    // Log request details for debugging
    console.log('🔒 Auth middleware debug:');
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Body:', typeof req.body === 'object' ? req.body : 'Non-object body');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Not authorized, no token' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Extract userId and userType from multiple possible sources
    // This gives us the most flexibility for handling different client configurations
    const sources = {
      query: { 
        userId: req.query.userId, 
        userType: req.query.userType
      },
      body: req.body && typeof req.body === 'object' ? { 
        userId: req.body.userId, 
        userType: req.body.userType
      } : null
    };
    
    // Log all potential sources for easier debugging
    console.log('🔍 Auth data sources:', JSON.stringify(sources));
    
    // Get userId from query params or body (prefer query)
    let userId = sources.query.userId || (sources.body && sources.body.userId);
    
    // Get userType - prefer query, then body, then default to 'caregiver'
    let userType = sources.query.userType || (sources.body && sources.body.userType) || 'caregiver';
    
    // If client type is specified but variations exist, normalize it
    if (userType.toLowerCase().includes('client')) {
      userType = 'client';
    } else if (userType.toLowerCase().includes('care')) {
      userType = 'caregiver';
    }
    
    // Log any inconsistency for debugging
    if (sources.query.userType && sources.body && sources.body.userType && 
        sources.query.userType !== sources.body.userType) {
      console.warn(`⚠️ Inconsistent userType normalized: Query=${sources.query.userType}, Body=${sources.body.userType}, Using=${userType}`);
    }
    
    // Ensure userType and userId are consistent in both query and body for future middleware
    if (req.body && typeof req.body === 'object') {
      req.body.userType = userType;
      req.body.userId = userId;
    }
    req.query.userType = userType;
    req.query.userId = userId;
    
    console.log(`👤 Using userId=${userId}, userType=${userType} for authentication`);
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID is required for authentication'
      });
    }
    
    console.log(`🔑 Authenticating: userId=${userId}, userType=${userType}, token=${token ? 'present' : 'missing'}`);
    
    try {
      // Verify user with the correct user type
      const user = await protectUser(userId, token, userType);
      
      if (!user) {
        console.error(`❌ Authentication failed for userId=${userId}, userType=${userType}`);
        return res.status(401).json({
          status: 'error',
          message: 'Not authorized, invalid token or user ID',
          details: {
            userId,
            userType,
            tokenPresent: !!token,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Log successful authentication
      console.log(`✅ Successfully authenticated ${userType} with ID ${userId}`);
      
      // Set user data in request for access in route handlers
      req.user = user;
      next();
    } catch (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({
        status: 'error',
        message: `Authentication failed: ${authError.message}`,
        details: {
          userId,
          userType,
          tokenPresent: !!token,
          error: authError.message
        }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

module.exports = { protectUser, protect };
