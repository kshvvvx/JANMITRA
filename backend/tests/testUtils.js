const { User } = require('../models');
const jwt = require('jsonwebtoken');

/**
 * Create a test user and get an authentication token
 * @param {Object} userData - User data to create
 * @param {Object} app - Express app instance
 * @returns {Promise<{user: Object, token: string}>} User and token
 */
async function createTestUserAndToken(userData, app) {
  // Create user
  const user = await User.create(userData);
  
  // Generate token based on user role
  let token;
  if (user.role === 'citizen') {
    // For citizens, we need to mock OTP verification
    const response = await request(app)
      .post('/api/auth/citizen/verify-otp')
      .send({
        phone: user.phone,
        otp: '123456',
        otpToken: 'mocked-otp-token'
      });
    token = response.body.token;
  } else {
    // For staff/supervisor, use password login
    const response = await request(app)
      .post('/api/auth/staff/login')
      .send({
        employeeId: user.employeeId,
        password: user.password
      });
    token = response.body.token;
  }
  
  return { user, token };
}

/**
 * Create a test complaint
 * @param {Object} complaintData - Complaint data
 * @param {string} token - Auth token
 * @param {Object} app - Express app instance
 * @returns {Promise<Object>} Created complaint
 */
async function createTestComplaint(complaintData, token, app) {
  const defaultData = {
    description: 'Test complaint',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139],
      state: 'Delhi',
      city: 'New Delhi',
      area: 'Test Area',
      preciseLocation: 'Near Test Location'
    },
    media: [{
      url: 'http://example.com/photo.jpg',
      mimeType: 'image/jpeg'
    }]
  };
  
  const response = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...defaultData, ...complaintData });
    
  return response.body.complaint;
}

module.exports = {
  createTestUserAndToken,
  createTestComplaint
};
