// Authentication routes for JANMITRA backend
// Handles OTP sending, verification, and user management

const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working!' });
});

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();
const users = new Map();

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
router.post('/send-otp', (req, res) => {
  console.log('Send OTP endpoint hit:', req.body);
  try {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || !/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number. Please provide a valid Indian mobile number.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(phoneNumber, {
      otp,
      expiresAt,
      attempts: 0
    });

    // In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Don't send OTP in production response
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate inputs
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: 'Phone number and OTP are required'
      });
    }

    // Check if OTP exists
    const storedOTP = otpStore.get(phoneNumber);
    if (!storedOTP) {
      return res.status(400).json({
        error: 'OTP not found or expired'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        error: 'OTP has expired'
      });
    }

    // Check attempt limit
    if (storedOTP.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsLeft: 3 - storedOTP.attempts
      });
    }

    // OTP is valid, remove it from store
    otpStore.delete(phoneNumber);

    // Check if user exists
    let user = users.get(phoneNumber);
    if (!user) {
      // Create new user
      user = {
        id: `user-${Date.now()}`,
        phoneNumber,
        language: 'en',
        userType: 'citizen',
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      users.set(phoneNumber, user);
    } else {
      // Update last login
      user.lastLoginAt = new Date().toISOString();
      users.set(phoneNumber, user);
    }

    // Generate JWT token (optional, for session management)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'janmitra-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }

    const user = users.get(phoneNumber);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', (req, res) => {
  try {
    const { phoneNumber, updates } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }

    const user = users.get(phoneNumber);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update user
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    users.set(phoneNumber, updatedUser);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the JWT token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
