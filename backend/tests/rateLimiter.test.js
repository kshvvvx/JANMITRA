const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../models');
const { app, startServer } = require('./setup');
const { redisClient } = require('../middleware/rateLimiter');

// Test data
const testCitizen = {
  phone: '+919876543211',
  name: 'Rate Limit Test User',
  role: 'citizen'
};

describe('Rate Limiting Tests', () => {
  let citizenToken;
  
  beforeAll(async () => {
    // Create test user
    const user = await User.create(testCitizen);
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/citizen/verify-otp')
      .send({
        phone: testCitizen.phone,
        otp: '123456',
        otpToken: 'mocked-otp-token'
      });
    
    citizenToken = response.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ phone: testCitizen.phone });
    
    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
    }
  });

  describe('Authentication Rate Limiting', () => {
    const testPhone = '+911234567890';
    
    test('should allow 5 login attempts within 10 minutes', async () => {
      // Make 5 login attempts (should all succeed)
      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/auth/citizen/send-otp')
          .send({ phone: testPhone })
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should block 6th login attempt within 10 minutes', async () => {
      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/citizen/send-otp')
        .send({ phone: testPhone });
      
      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/rate limit exceeded/i);
    });
  });

  describe('Complaint Submission Rate Limiting', () => {
    const testComplaint = {
      description: 'Test complaint for rate limiting',
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

    test('should allow 20 complaint submissions per hour', async () => {
      // Make 20 complaint submissions (should all succeed)
      const requests = Array(20).fill().map(() => 
        request(app)
          .post('/api/complaints')
          .set('Authorization', `Bearer ${citizenToken}`)
          .send({
            ...testComplaint,
            description: `Test complaint ${Date.now()}` // Make each complaint unique
          })
      );
      
      const responses = await Promise.all(requests);
      responses.forEach((response, index) => {
        if (response.status !== 201) {
          console.error(`Request ${index + 1} failed:`, response.body);
        }
        expect(response.status).toBe(201);
      });
    });

    test('should block 21st complaint submission within an hour', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          ...testComplaint,
          description: 'This should be rate limited'
        });
      
      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/rate limit exceeded/i);
    });
  });

  describe('Supervisor Escalation Rate Limiting', () => {
    let testComplaintId;

    beforeAll(async () => {
      // Create a test complaint
      const response = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          description: 'Test complaint for escalation',
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
        });
      
      testComplaintId = response.body.complaint._id;
    });

    test('should allow 10 escalations per week', async () => {
      // Make 10 escalation attempts (should all succeed with test data)
      const requests = Array(10).fill().map(() => 
        request(app)
          .post(`/api/complaints/${testComplaintId}/escalate`)
          .set('Authorization', `Bearer ${citizenToken}`)
          .send({
            reason: 'Test escalation'
          })
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect([200, 400].includes(response.status)).toBe(true);
      });
    });

    test('should block 11th escalation within a week', async () => {
      const response = await request(app)
        .post(`/api/complaints/${testComplaintId}/escalate`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          reason: 'This should be rate limited'
        });
      
      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/rate limit exceeded/i);
    });
  });
});
