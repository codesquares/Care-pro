// src/middleware/authMiddleware.js
const axios = require('axios');
const { configDotenv } = require('dotenv');
configDotenv();

// Protect middleware - Verifies user with JWT token validation
const protectUser = async (userId, token, userType = 'caregiver') => {
  const External_Auth_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';
  const jwt = require('jsonwebtoken');
  
  try {
    if (!userId || !token) {
      console.log('❌ Missing userId or token');
      return null;
    }

    // First, validate and decode the JWT token
    console.log('🔍 Validating JWT token...');
    let decoded;
    try {
      // Decode the token first to check its structure
      decoded = jwt.decode(token);
      console.log('🔍 Decoded JWT token:', decoded);
      
      if (!decoded) {
        console.log('❌ Invalid JWT token - cannot decode');
        return null;
      }
      
      // Check if token has expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        console.log('❌ JWT token has expired');
        return null;
      }
      
      console.log('✅ JWT token is valid and not expired');
      
      // Extract user info from JWT token
      const tokenUserId = decoded.userId || decoded.id || decoded.sub;
      const tokenEmail = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decoded.email;
      const tokenRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role;
      
      console.log(`🔍 Token contains - userId: ${tokenUserId}, email: ${tokenEmail}, role: ${tokenRole}`);
      
    } catch (jwtError) {
      console.error('❌ JWT validation error:', jwtError.message);
      return null;
    }

    console.log(`🔍 Verifying user with type: ${userType}, userId: ${userId}`);
    
    // Now verify the user exists in the external API
    // We still need this to get full user details
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
        // Add JWT token info to user object
        user.tokenData = {
          email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
          role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
          exp: decoded.exp
        };
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
          // Add JWT token info to user object
          user.tokenData = {
            email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            exp: decoded.exp
          };
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

// Admin protect middleware - Validates JWT token and checks for admin role
const protectAdmin = async (req, res, next) => {
  try {
    console.log('🔒 Admin auth middleware debug:');
    console.log('Headers:', req.headers);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Not authorized, no token' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Decode JWT token to get role information
    // You'll need to install jsonwebtoken: npm install jsonwebtoken
    const jwt = require('jsonwebtoken');
    
    try {
      // Decode the token (you might need to verify with your JWT_SECRET)
      const decoded = jwt.decode(token);
      console.log('🔍 Decoded JWT token:', decoded);
      
      if (!decoded) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
      
      // Check for admin role in the token claims
      // Based on your JWT structure, the role is in: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      const roleClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      
      if (!roleClaim || roleClaim.toLowerCase() !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Admin role required.',
          userRole: roleClaim
        });
      }
      
      console.log(`✅ Admin authentication successful. Role: ${roleClaim}`);
      
      // Set admin user data in request
      req.user = {
        role: roleClaim,
        email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
        isAdmin: true
      };
      
      next();
    } catch (jwtError) {
      console.error('JWT decode error:', jwtError);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

module.exports = { protectUser, protect, protectAdmin };
