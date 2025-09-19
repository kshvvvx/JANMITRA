const request = require('supertest');
const mongoose = require('mongoose');
const { User, Complaint } = require('../models');
const { app, startServer } = require('./setup');
const { redisClient } = require('../utils/cache');
const { keyBuilders } = require('../middleware/cacheMiddleware');

// Test data
const testCitizen = {
  phone: '+919876543212',
  name: 'Cache Test User',
  role: 'citizen'
};

const testStaff = {
  employeeId: 'STAFF999',
  password: 'test123',
  name: 'Cache Test Staff',
  role: 'staff',
  department: 'public_works'
};

describe('Cache Integration Tests', () => {
  let citizenToken;
  let staffToken;
  let testComplaintId;

  beforeAll(async () => {
    // Create test users
    const [citizen, staff] = await Promise.all([
      User.create(testCitizen),
      User.create(testStaff)
    ]);

    // Get auth tokens
    const [citizenAuth, staffAuth] = await Promise.all([
      request(app)
        .post('/api/auth/citizen/verify-otp')
        .send({
          phone: testCitizen.phone,
          otp: '123456',
          otpToken: 'mocked-otp-token'
        }),
      request(app)
        .post('/api/auth/staff/login')
        .send({
          employeeId: testStaff.employeeId,
          password: testStaff.password
        })
    ]);

    citizenToken = citizenAuth.body.token;
    staffToken = staffAuth.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ 
        $or: [
          { phone: testCitizen.phone },
          { employeeId: testStaff.employeeId }
        ]
      }),
      Complaint.deleteMany({})
    ]);
    
    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
    }
  });

  describe('Complaint Caching', () => {
    test('should cache GET /complaints/mine responses', async () => {
      // First request - should hit the database
      const firstResponse = await request(app)
        .get('/api/complaints/mine')
        .set('Authorization', `Bearer ${citizenToken}`);
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.headers['x-cache']).toBeUndefined();

      // Second request - should be served from cache
      const secondResponse = await request(app)
        .get('/api/complaints/mine')
        .set('Authorization', `Bearer ${citizenToken}`);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.headers['x-cache']).toBe('HIT');
    });

    test('should cache GET /complaints responses for staff', async () => {
      // First request - should hit the database
      const firstResponse = await request(app)
        .get('/api/complaints?status=unresolved&page=1&limit=10')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.headers['x-cache']).toBeUndefined();

      // Second request - should be served from cache
      const secondResponse = await request(app)
        .get('/api/complaints?status=unresolved&page=1&limit=10')
        .set('Authorization', `Bearer ${staffToken}`);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.headers['x-cache']).toBe('HIT');
    });

    test('should invalidate cache on new complaint creation', async () => {
      // Get initial cache state
      const cacheKey = keyBuilders.citizenComplaints({ user: { _id: testCitizen._id } });
      await expect(redisClient.get(cacheKey)).resolves.not.toBeNull();

      // Create a new complaint (should invalidate cache)
      const newComplaint = {
        description: 'Test complaint for cache invalidation',
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
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(newComplaint);

      expect(response.status).toBe(201);
      testComplaintId = response.body.complaint._id;

      // Verify cache was invalidated
      await expect(redisClient.get(cacheKey)).resolves.toBeNull();
    });

    test('should invalidate cache on status update', async () => {
      if (!testComplaintId) {
        return; // Skip if no test complaint was created
      }

      // Get initial cache state
      const cacheKey = keyBuilders.staffComplaints({ 
        query: { status: 'unresolved', page: 1, limit: 10 } 
      });
      
      // Prime the cache
      await request(app)
        .get('/api/complaints?status=unresolved&page=1&limit=10')
        .set('Authorization', `Bearer ${staffToken}`);
      
      await expect(redisClient.get(cacheKey)).resolves.not.toBeNull();

      // Update complaint status (should invalidate cache)
      const updateResponse = await request(app)
        .patch(`/api/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          status: 'in_progress',
          comment: 'Moving to in progress'
        });

      expect(updateResponse.status).toBe(200);

      // Verify cache was invalidated
      await expect(redisClient.get(cacheKey)).resolves.toBeNull();
    });
  });
});
