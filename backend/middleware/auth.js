const jwt = require('jsonwebtoken');
const { Citizen, Staff, Supervisor } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Generate JWT token
const generateToken = (user, role) => {
  return jwt.sign(
    { 
      id: user._id,
      userId: user.citizen_id || user.staff_id || user.supervisor_id,
      role: role,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user based on role
    let user = null;
    switch (decoded.role) {
      case 'citizen':
        user = await Citizen.findById(decoded.id);
        break;
      case 'staff':
        user = await Staff.findById(decoded.id);
        break;
      case 'supervisor':
        user = await Supervisor.findById(decoded.id);
        break;
      default:
        return res.status(403).json({
          error: 'Invalid user role'
        });
    }

    if (!user) {
      return res.status(403).json({
        error: 'User not found'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      userData: user
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token'
      });
    }
    
    console.error('Auth middleware error:', error);
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

// Specific role middlewares
const requireCitizen = requireRole(['citizen']);
const requireStaff = requireRole(['staff']);
const requireSupervisor = requireRole(['supervisor']);
const requireStaffOrSupervisor = requireRole(['staff', 'supervisor']);
const requireAnyUser = requireRole(['citizen', 'staff', 'supervisor']);

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
