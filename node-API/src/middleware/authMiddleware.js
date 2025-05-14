const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/userModel');
require('dotenv').config();

/**
 * Authentication middleware that validates tokens from both local and Azure APIs
 */
const protect = async (req, res, next) => {
  try {
    let token;
    let userId = null;
    let tokenOrigin = null;

    // Extract token from header, body, or query
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body?.token) {
      token = req.body.token;
      userId = req.body.userId || null;
    } else if (req.query?.token) {
      token = req.query.token;
      userId = req.query.userId || null;
    }

    // If no token is provided
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided. Please log in to get access.',
      });
    }

    let decoded;
    let currentUser;

    try {
      // First, attempt to verify with local JWT secret
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        tokenOrigin = 'local';
      } catch (localVerifyError) {
        // If local verification fails, attempt Azure API verification
        if (process.env.AZURE_AUTH_ENDPOINT) {
          const response = await axios.post(
            `${process.env.AZURE_AUTH_ENDPOINT}/validate-token`,
            { token }
          );

          if (response.data?.valid) {
            decoded = response.data.decoded;
            tokenOrigin = 'azure';
          } else {
            throw new Error('Invalid token from Azure API');
          }
        } else {
          throw localVerifyError;
        }
      }

      // Validate userId if provided
      if (userId && decoded.id !== userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User ID does not match the token. Authentication failed.',
        });
      }

      // Retrieve user from the database
      currentUser = await User.findById(decoded.id);

      // Handle Azure API users who do not exist in local database
      if (!currentUser && tokenOrigin === 'azure') {
        currentUser = {
          _id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName || '',
          lastName: decoded.lastName || '',
          isExternalUser: true, // Flag to indicate this is an Azure user
        };
      } else if (!currentUser) {
        return res.status(401).json({
          status: 'error',
          message: 'The user belonging to this token no longer exists.',
        });
      }
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or token expired. Please log in again.',
      });
    }

    // Attach user to request object
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed. Please try again later.',
    });
  }
};

/**
 * Authorization middleware to restrict access based on user roles
 * @param {...string} roles - Allowed user roles (e.g., 'admin', 'user')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
