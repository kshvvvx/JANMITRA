const jwt = require('jsonwebtoken');
const config = require('config');

/**
 * Middleware to check if user has required role(s)
 * @param {Array} roles - Array of roles allowed to access the resource
 * @returns {Function} Express middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.'
        });
      }

      // Check if user's role is in the allowed roles
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Middleware to check if user owns the resource or has required role
 * @param {Array} roles - Array of roles allowed to access the resource
 * @returns {Function} Express middleware function
 */
const authorizeOrOwner = (roles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.'
        });
      }

      // Check if user is the owner of the resource
      const resourceUserId = req.params.userId || req.body.userId;
      const isOwner = resourceUserId && req.user.id === resourceUserId;

      // Check if user's role is in the allowed roles
      const hasRequiredRole = roles.length === 0 || roles.includes(req.user.role);

      // Allow access if user is owner or has required role
      if (!isOwner && !hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Available user roles in the system
 */
const ROLES = {
  CITIZEN: 'citizen',
  STAFF: 'staff',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
};

/**
 * Check if a role is valid
 * @param {String} role - Role to check
 * @returns {Boolean} True if role is valid
 */
const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Check if user has admin role
 * @param {Object} user - User object
 * @returns {Boolean} True if user is admin
 */
const isAdmin = (user) => {
  return user && user.role === ROLES.ADMIN;
};

/**
 * Check if user has supervisor role or higher
 * @param {Object} user - User object
 * @returns {Boolean} True if user is supervisor or admin
 */
const isSupervisorOrAdmin = (user) => {
  return user && (user.role === ROLES.SUPERVISOR || user.role === ROLES.ADMIN);
};

module.exports = {
  authorize,
  authorizeOrOwner,
  ROLES,
  isValidRole,
  isAdmin,
  isSupervisorOrAdmin
};
