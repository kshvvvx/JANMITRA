const jwt = require('jsonwebtoken');
const { Citizen, Staff, Supervisor } = require('../models');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Log environment for debugging
logger.debug(`JWT_SECRET: ${JWT_SECRET ? 'Set' : 'Not set'}`);
logger.debug(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Generate JWT token
const generateToken = (user, role) => {
  // Ensure role is always lowercase for consistency
  const normalizedRole = role ? role.toLowerCase() : 'citizen';
  
  // Log token generation details
  logger.debug('Generating JWT token', {
    userId: user._id,
    role: normalizedRole,
    email: user.email
  });

  const token = jwt.sign(
    { 
      id: user._id,
      userId: user.citizen_id || user.staff_id || user.supervisor_id,
      role: normalizedRole,  // Use normalized role
      email: user.email,
      iat: Math.floor(Date.now() / 1000)  // Add issued at time
    },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      algorithm: 'HS256'  // Explicitly set algorithm
    }
  );

  // Log the first part of the token for debugging (without exposing the signature)
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    logger.debug('Generated token header and payload', {
      header: JSON.parse(Buffer.from(tokenParts[0], 'base64').toString()),
      payload: JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    });
  }

  return token;
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication attempt without token', { ip: req.ip, path: req.path });
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    // Decode the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Log the entire decoded token for debugging
    logger.debug('Decoded JWT token', { 
      decoded,
      token: token,  // Log the actual token for verification
      header: JSON.stringify(jwt.decode(token, { complete: true })?.header)
    });
    
    // Normalize role to lowercase for consistent comparison
    const normalizedRole = decoded.role ? decoded.role.toLowerCase() : null;
    
    // Log the normalized role for debugging
    logger.debug('Role check', { 
      originalRole: decoded.role, 
      normalizedRole,
      userId: decoded.id 
    });
    
    // Ensure we have a valid role
    if (!normalizedRole || !['citizen', 'staff', 'supervisor'].includes(normalizedRole)) {
      const errorMsg = `Invalid or missing role in JWT token: '${decoded.role}'`;
      logger.warn(errorMsg, { 
        decoded, 
        allowedRoles: ['citizen', 'staff', 'supervisor'] 
      });
      return res.status(403).json({
        success: false,
        error: 'Invalid user role',
        details: errorMsg,
        allowedRoles: ['citizen', 'staff', 'supervisor']
      });
    }
    
    // Find user based on normalized role
    let user = null;
    try {
      switch (normalizedRole) {
        case 'citizen':
          logger.debug('Looking up citizen user', { userId: decoded.id });
          user = await Citizen.findById(decoded.id);
          break;
        case 'staff':
          logger.debug('Looking up staff user', { userId: decoded.id });
          user = await Staff.findById(decoded.id);
          break;
        case 'supervisor':
          logger.debug('Looking up supervisor user', { userId: decoded.id });
          user = await Supervisor.findById(decoded.id);
          break;
          logger.warn(errorMsg, { 
            originalRole: decoded.role,
            normalizedRole,
            allowedRoles: ['citizen', 'staff', 'supervisor']
          });
          return res.status(403).json({
            success: false,
            error: 'Invalid user role',
            details: errorMsg,
            allowedRoles: ['citizen', 'staff', 'supervisor']
          });
      }

      if (!user) {
        logger.warn('User not found in database', { userId: decoded.id, role: decoded.role });
        return res.status(401).json({
          error: 'User not found or unauthorized'
        });
      }

      // Check if user is active (for staff/supervisor)
      if (user.active === false) {
        logger.warn('Attempt to access deactivated account', { userId: user._id, role: decoded.role });
        return res.status(403).json({
          error: 'Account is deactivated'
        });
      }

      // Attach user and role to request object
      req.user = user.toObject ? user.toObject() : user;
      req.role = normalizedRole;
      
      // Make sure the user object has the role
      req.user.role = normalizedRole;
      
      // Log successful authentication
      logger.debug('Authentication successful', {
        path: req.path,
        role: normalizedRole,
        userId: user._id || user.id,
        user: {
          id: user._id || user.id,
          role: normalizedRole,
          profileComplete: user.name && user.email
        }
      });
      
      next();
    } catch (dbError) {
      logger.error('Database error during authentication', { 
        error: dbError.message,
        stack: dbError.stack 
      });
      return res.status(500).json({
        error: 'Authentication failed due to server error'
      });
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', { error: error.message });
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired JWT token');
      return res.status(401).json({
        error: 'Token expired'
      });
    }
    
    logger.error('Unexpected authentication error', { 
      error: error.message,
      stack: error.stack,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role middlewares - functions that combine auth and role checks
const requireCitizen = (req, res, next) => {
  authenticateToken(req, res, (authErr) => {
    if (authErr) return;
    requireRole(['citizen'])(req, res, next);
  });
};

const requireStaff = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireRole(['staff'])(req, res, next);
  });
};

const requireSupervisor = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireRole(['supervisor'])(req, res, next);
  });
};

const requireStaffOrSupervisor = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireRole(['staff', 'supervisor'])(req, res, next);
  });
};

const requireAnyUser = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireRole(['citizen', 'staff', 'supervisor'])(req, res, next);
  });
};

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireCitizen,
  requireStaff,
  requireSupervisor,
  requireStaffOrSupervisor,
  requireAnyUser
};
