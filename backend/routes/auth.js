// Authentication routes for JANMITRA backend
// Handles citizen OTP login, staff/supervisor password login, and JWT management

const express = require('express');
const bcrypt = require('bcryptjs');
const { Citizen, Staff, Supervisor } = require('../models');
const { generateToken, authenticateToken, requireAnyUser } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for citizen login
router.post('/citizen/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number. Please provide a valid 10-digit Indian mobile number.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0
    });

    // In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Send OTP in development for testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Verify OTP and login citizen
router.post('/citizen/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        error: 'Phone number and OTP are required'
      });
    }

    // Check if OTP exists
    const storedOTP = otpStore.get(phone);
    if (!storedOTP) {
      return res.status(400).json({
        error: 'OTP not found or expired'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({
        error: 'OTP has expired'
      });
    }

    // Check attempt limit
    if (storedOTP.attempts >= 3) {
      otpStore.delete(phone);
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
    otpStore.delete(phone);

    // Find or create citizen
    let citizen = await Citizen.findOne({ phone });
    if (!citizen) {
      // Create new citizen
      const citizen_id = `CIT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
      citizen = new Citizen({
        citizen_id,
        phone,
        name: name || `User ${phone}`,
        verified: true
      });
      await citizen.save();
    }

    // Generate JWT token
    const token = generateToken(citizen, 'citizen');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: citizen._id,
        citizen_id: citizen.citizen_id,
        name: citizen.name,
        phone: citizen.phone,
        role: 'citizen'
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Staff/Supervisor login with ID + password
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
        staff_id: user.staff_id || user.supervisor_id,
        name: user.name,
        email: user.email,
        department: user.department || user.departments,
        role: role
      }
    });

  } catch (error) {
    console.error('Error during staff login:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        userId: user.userId,
        role: user.role,
        email: user.email,
        name: user.userData.name,
        phone: user.userData.phone,
        department: user.userData.department || user.userData.departments,
        verified: user.userData.verified,
        active: user.userData.active
      }
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = req.user;

    let updatedUser;
    
    // Update based on user role
    switch (user.role) {
      case 'citizen':
        updatedUser = await Citizen.findByIdAndUpdate(
          user.id,
          { 
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone }),
            ...(address && { address })
          },
          { new: true }
        );
        break;
        
      case 'staff':
        updatedUser = await Staff.findByIdAndUpdate(
          user.id,
          { 
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone })
          },
          { new: true }
        );
        break;
        
      case 'supervisor':
        updatedUser = await Supervisor.findByIdAndUpdate(
          user.id,
          { 
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone })
          },
          { new: true }
        );
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid user role'
        });
    }

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
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
