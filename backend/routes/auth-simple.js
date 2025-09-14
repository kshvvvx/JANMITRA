// Simple authentication routes for testing
const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working!', timestamp: Date.now() });
});

// Send OTP endpoint
router.post('/send-otp', (req, res) => {
  console.log('Send OTP endpoint hit:', req.body);
  
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }
    
    // Generate a simple OTP
    const otp = '123456';
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp // Only for development
    });
    
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', (req, res) => {
  console.log('Verify OTP endpoint hit:', req.body);
  
  try {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: 'Phone number and OTP are required'
      });
    }
    
    // Simple verification (accept any 6-digit OTP)
    if (otp.length === 6) {
      const user = {
        id: `user-${Date.now()}`,
        phoneNumber,
        language: 'en',
        userType: 'citizen',
        isVerified: true,
        createdAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'OTP verified successfully',
        user
      });
    } else {
      res.status(400).json({
        error: 'Invalid OTP'
      });
    }
    
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
