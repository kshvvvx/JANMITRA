const request = require('supertest');
const mongoose = require('mongoose');
const { User, Complaint } = require('../models');
const { app } = require('./setup');
const jwt = require('jsonwebtoken');

describe('Complaint Management Tests', () => {
  // Test data
  const testCitizen = {
    phone: '+919876543210',
    name: 'Test User',
    role: 'citizen'
  };

  let citizenToken;
  let testComplaintId;

  // Setup before tests
  beforeAll(async () => {
    // Create test citizen and get token
    const citizen = await User.create(testCitizen);
    
    // Mock OTP verification to get token
    const response = await request(app)
      .post('/api/auth/citizen/verify-otp')
      .send({
        phone: testCitizen.phone,
        otp: '123456',
        otpToken: 'mocked-otp-token'
      });
    
    citizenToken = response.body.token;
  });

  // Test complaint creation
  describe('Complaint Creation', () => {
    const validComplaint = {
      description: 'Test complaint description',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        state: 'Delhi',
        city: 'New Delhi',
        area: 'Connaught Place',
        preciseLocation: 'Near Central Park'
      },
      media: [
        {
          url: 'http://example.com/photo.jpg',
          mimeType: 'image/jpeg'
        }
      ]
    };

    test('should create a new complaint with valid data', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(validComplaint);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.complaint).toBeDefined();
      expect(response.body.complaint.complaintNumber).toMatch(/^COMP-\w{8}-\w{4}$/);
      expect(response.body.complaint.status).toBe('unresolved');
      expect(response.body.complaint.createdBy).toBeDefined();
      
      // Save complaint ID for later tests
      testComplaintId = response.body.complaint._id;
    });

    test('should reject complaint without description', async () => {
      const invalidComplaint = { ...validComplaint, description: '' };
      
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(invalidComplaint);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/description.*required/i);
    });

    test('should reject complaint with invalid media type', async () => {
      const invalidMediaComplaint = {
        ...validComplaint,
        media: [{
          url: 'http://example.com/document.pdf',
          mimeType: 'application/pdf' // Invalid type
        }]
      };
      
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(invalidMediaComplaint);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/media type/i);
    });

    test('should prevent duplicate complaints within 30 minutes', async () => {
      // First complaint
      await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(validComplaint);
      
      // Second identical complaint
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(validComplaint);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/duplicate/i);
    });
  });

  // Test complaint retrieval
  describe('Complaint Retrieval', () => {
    test('should retrieve citizen\'s own complaints', async () => {
      const response = await request(app)
        .get('/api/complaints/mine')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.complaints)).toBe(true);
      
      // Should find the complaint we created in the previous test
      const complaint = response.body.complaints.find(c => c._id === testComplaintId);
      expect(complaint).toBeDefined();
      expect(complaint.status).toBe('unresolved');
    });

    test('should filter complaints by status', async () => {
      // Create a resolved complaint
      await Complaint.create({
        description: 'Resolved test complaint',
        status: 'resolved',
        createdBy: (jwt.verify(citizenToken, process.env.JWT_SECRET)).id,
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        complaintNumber: 'COMP-TEST123'
      });

      // Test unresolved filter
      const unresolvedResponse = await request(app)
        .get('/api/complaints/mine?status=unresolved')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(unresolvedResponse.status).toBe(200);
      expect(unresolvedResponse.body.complaints.every(c => c.status === 'unresolved')).toBe(true);

      // Test resolved filter
      const resolvedResponse = await request(app)
        .get('/api/complaints/mine?status=resolved')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(resolvedResponse.status).toBe(200);
      expect(resolvedResponse.body.complaints.every(c => c.status === 'resolved')).toBe(true);
    });
  });

  // Test complaint upvoting
  describe('Complaint Upvoting', () => {
    test('should allow citizens to upvote complaints', async () => {
      const response = await request(app)
        .post(`/api/complaints/${testComplaintId}/upvote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.upvotes).toBe(1);
      expect(response.body.hasUpvoted).toBe(true);
    });

    test('should prevent duplicate upvotes from same user', async () => {
      // First upvote (should succeed)
      await request(app)
        .post(`/api/complaints/${testComplaintId}/upvote`)
        .set('Authorization', `Bearer ${citizenToken}`);
      
      // Second upvote (should fail)
      const response = await request(app)
        .post(`/api/complaints/${testComplaintId}/upvote`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already upvoted/i);
    });
  });
});
