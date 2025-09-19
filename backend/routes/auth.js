// Authentication routes for JANMITRA backend
// Handles Firebase OTP authentication, JWT management, and user profiles

const express = require('express');
const bcrypt = require('bcryptjs');
const { Citizen, Staff, Supervisor } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { getAuth } = require('../config/firebase');
const logger = require('../../config/logger');

const router = express.Router();

// Initialize Firebase Auth
const firebaseAuth = getAuth();

/**
 * @route POST /api/v1/auth/start-verification
 * @desc Start phone number verification (sends OTP)
 * @access Public
 */
router.post('/start-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number (Indian format: +91XXXXXXXXXX)
    if (!phoneNumber || !/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number. Please provide a valid Indian mobile number with country code (+91).'
      });
    }

    // In a real app, you would implement Firebase phone auth here
    // For now, we'll simulate sending an OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // In production, store this in Redis or a database
    // For this example, we'll just log it
    logger.info(`OTP for ${phoneNumber}: ${otp} (expires at: ${new Date(expiresAt).toISOString()})`);
    
    res.json({
      success: true,
      message: 'Verification code sent',
      // In production, don't send the OTP in the response
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    logger.error('Error starting verification:', error);
    res.status(500).json({
      error: 'Failed to send verification code',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/verify-phone
 * @desc Verify OTP and authenticate user
 * @access Public
 * 
 * This endpoint verifies the OTP and either:
 * - Finds an existing user by phone and returns a JWT, OR
 * - Creates a new user with just phoneNumber and profileComplete: false
 */
router.post('/verify-phone', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate inputs
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }

    if (!otp) {
      return res.status(400).json({
        error: 'OTP is required'
      });
    }

    // In a real app, verify the OTP with Firebase
    // For now, we'll just check if it's a 6-digit number
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Please enter a 6-digit code.'
      });
    }

    // Find or create user in our database
    let user = await Citizen.findOne({ phone: phoneNumber });
    const isNewUser = !user;
    
    if (isNewUser) {
      // Create new user with minimal info
      user = new Citizen({
        phone: phoneNumber,
        phone_verified: true,
        profileComplete: false,
        created_at: new Date()
      });
      await user.save();
    }

    // Log user data before token generation
    logger.debug('Generating token for user', { 
      userId: user._id,
      phone: user.phone,
      profileComplete: user.profileComplete 
    });

    // Generate JWT token with user data in the expected format
    const token = generateToken(user, 'citizen');
    
    // Log token generation
    logger.debug('Generated token', { 
      userId: user._id,
      token: token.substring(0, 30) + '...' // Log first 30 chars of token
    });

    // Return user data without sensitive information
    const userResponse = {
      id: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      profileComplete: user.profileComplete || false,
      role: 'citizen'  // Explicitly set role to lowercase
    };

    res.json({
      success: true,
      token,
      isNewUser,
      user: userResponse
    });
  } catch (error) {
    logger.error('Error in verify-phone:', error);
    
    // Handle duplicate key error for phone number
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
      return res.status(400).json({
        success: false,
        error: 'This phone number is already registered.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to verify phone number',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/v1/auth/complete-profile
 * @desc Complete user profile after initial signup
 * @access Private (requires valid JWT)
 * 
 * Required fields: name, citizen_id
 * Optional fields: email, address, location
 */
router.post('/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, citizen_id, address, location } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!name || !citizen_id) {
      return res.status(400).json({
        success: false,
        error: 'Name and citizen ID are required to complete your profile.'
      });
    }
    
    // Validate citizen_id format (example: 12-digit Aadhaar)
    if (!/^\d{12}$/.test(citizen_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid citizen ID format. Please enter a 12-digit number.'
      });
    }
    
    // Check if the citizen_id is already taken by another user
    const existingCitizen = await Citizen.findOne({ 
      _id: { $ne: userId },
      citizen_id: citizen_id 
    });
    
    if (existingCitizen) {
      return res.status(400).json({
        success: false,
        error: 'This citizen ID is already registered with another account.'
      });
    }

    // Find the user
    const user = await Citizen.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please sign up first.'
      });
    }
    
    // If user has already completed their profile, return their current data
    if (user.profileComplete) {
      return res.json({
        success: true,
        message: 'Profile is already complete',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          citizen_id: user.citizen_id,
          profileComplete: true,
          role: 'citizen'
        }
      });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    // Update user profile
    const updatedUser = await Citizen.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email: email || user.email,  // Keep existing email if not provided
          citizen_id,
          address: address || user.address,
          location: location || user.location,
          profileComplete: true,
          updated_at: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-__v -created_at -updated_at');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update profile. Please try again.'
      });
    }
    
    // Generate new token with updated user data in the expected format
    const token = generateToken(updatedUser, 'citizen');
    
    // Prepare user response
    const userResponse = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      citizen_id: updatedUser.citizen_id,
      address: updatedUser.address,
      location: updatedUser.location,
      profileComplete: true,
      role: 'citizen'
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    logger.error('Error completing profile:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      let errorField = 'field';
      if (error.keyPattern && error.keyPattern.email) {
        errorField = 'email';
      } else if (error.keyPattern && error.keyPattern.citizen_id) {
        errorField = 'citizen ID';
      }
      
      return res.status(400).json({
        success: false,
        error: `This ${errorField} is already registered with another account.`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update profile. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user's profile
 * @access Private (requires valid JWT)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Debug log the complete request user object
    logger.debug('Request user object:', { user: req.user });
    
    // Handle both req.user.id and req.user._id
    const userId = req.user.id || req.user._id;
    const role = (req.user.role || '').toLowerCase();
    
    if (!userId) {
      logger.error('User ID not found in request', { user: req.user });
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found in request',
        details: 'The authenticated user ID is missing from the request.'
      });
    }
    
    if (!['citizen', 'staff', 'supervisor'].includes(role)) {
      logger.error('Invalid role in /me endpoint', { 
        userId, 
        role,
        allowedRoles: ['citizen', 'staff', 'supervisor']
      });
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user role',
        details: `Role '${role}' is not valid for this endpoint`,
        allowedRoles: ['citizen', 'staff', 'supervisor']
      });
    }

    logger.debug(`Looking up ${role} user with ID: ${userId}`);
    
    let user;
    try {
      switch (role) {
        case 'citizen':
          user = await Citizen.findById(userId).select('-__v -created_at -updated_at');
          break;
        case 'staff':
          user = await Staff.findById(userId).select('-__v -created_at -updated_at');
          break;
        case 'supervisor':
          user = await Supervisor.findById(userId).select('-__v -created_at -updated_at');
          break;
      }
    } catch (dbError) {
      logger.error('Database error when fetching user', {
        error: dbError.message,
        userId,
        role
      });
      throw dbError;
    }

    if (!user) {
      logger.error('User not found in database', { userId, role });
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        details: `No ${role} found with ID: ${userId}`
      });
    }

    // Convert to plain object and add role
    const userObj = user.toObject ? user.toObject() : user;
    userObj.role = role;
    userObj.profileComplete = !!(user.name && user.email);
    
    // Remove sensitive data
    delete userObj.password;
    delete userObj.otp;
    delete userObj.otpExpires;

    logger.debug('Successfully retrieved user profile', { 
      userId: userObj._id || userObj.id,
      role,
      profileComplete: userObj.profileComplete 
    });

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    logger.error('Error in /me endpoint', { 
      error: error.message, 
      stack: error.stack,
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/v1/auth/staff/login
 * @desc Staff/Supervisor login with ID + password
 * @access Public
 */
router.post('/staff/login', async (req, res) => {
  try {
    const { staff_id, password } = req.body;

    // Validate inputs
    if (!staff_id || !password) {
      return res.status(400).json({
        error: 'Staff ID and password are required'
      });
    }

    // Find staff member
    let user = await Staff.findOne({ staff_id });
    let role = 'staff';

    // If not found in staff, check supervisors
    if (!user) {
      user = await Supervisor.findOne({ supervisor_id: staff_id });
      role = 'supervisor';
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        error: 'Account is deactivated'
      });
    }

    // Generate JWT token
    const token = generateToken(user, role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        [role === 'staff' ? 'staff_id' : 'supervisor_id']: user.staff_id || user.supervisor_id,
        name: user.name,
        email: user.email,
        department: user.department || user.departments,
        role: role,
        profileComplete: true
      }
    });
  } catch (error) {
    logger.error('Error during staff login:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout endpoint (client-side token invalidation)
 * @access Private (requires valid JWT)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a real implementation, you might want to blacklist the JWT token
  // For now, we'll just return success and let the client handle token invalidation
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
