const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../models');
const { app } = require('./setup');
const jwt = require('jsonwebtoken');

describe('Authentication Tests', () => {
  // Test data
  const testCitizen = {
    phone: '+919876543210',
    name: 'Test User',
    role: 'citizen'
  };

  const testStaff = {
    employeeId: 'STAFF001',
    password: 'password123',
    name: 'Test Staff',
    role: 'staff',
    department: 'public_works'
  };

  // Test OTP verification
  describe('Citizen OTP Authentication', () => {
    let otpToken;

    test('should send OTP to citizen', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/send-otp')
        .send({ phone: testCitizen.phone });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.otpToken).toBeDefined();
      
      otpToken = response.body.otpToken;
    });

    test('should verify OTP and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/citizen/verify-otp')
        .send({
          phone: testCitizen.phone,
          otp: '123456',
          otpToken: otpToken
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      // Verify token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.role).toBe('citizen');
      expect(decoded.phone).toBe(testCitizen.phone);
    });
  });

  // Test staff login
  describe('Staff Authentication', () => {
    beforeAll(async () => {
      // Create a test staff user
      await User.create(testStaff);
    });

    test('should login staff with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/staff/login')
        .send({
          employeeId: testStaff.employeeId,
          password: testStaff.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      // Verify token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.role).toBe('staff');
      expect(decoded.employeeId).toBe(testStaff.employeeId);
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/staff/login')
        .send({
          employeeId: testStaff.employeeId,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // Test role-based access control
  describe('Role-Based Access Control', () => {
    let citizenToken;
    let staffToken;

    beforeAll(async () => {
      // Create test users and get tokens
      const citizen = await User.create(testCitizen);
      await User.create(testStaff);
      
      // Get citizen token
      const citizenRes = await request(app)
        .post('/api/auth/citizen/verify-otp')
        .send({
          phone: testCitizen.phone,
          otp: '123456',
          otpToken: 'mocked-otp-token'
        });
      citizenToken = citizenRes.body.token;

      // Get staff token
      const staffRes = await request(app)
        .post('/api/auth/staff/login')
        .send({
          employeeId: testStaff.employeeId,
          password: testStaff.password
        });
      staffToken = staffRes.body.token;
    });

    test('should allow staff to access staff-only routes', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
    });

    test('should prevent citizens from accessing staff-only routes', async () => {
      const response = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/access denied/i);
    });

    test('should prevent unauthenticated access to protected routes', async () => {
      const response = await request(app)
        .get('/api/complaints');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/no token provided/i);
    });
  });
});
