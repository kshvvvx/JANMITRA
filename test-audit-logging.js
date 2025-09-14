const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./backend');
const AuditLog = require('./backend/models/AuditLog');
const { v4: uuidv4 } = require('uuid');

// Test data
const TEST_USER = {
  _id: '5f8d0a8b7f8f8b2b1c7d0a8b',
  role: 'supervisor',
  departmentId: '5f8d0a8b7f8f8b2b1c7d0a8c'
};

describe('Audit Logging System', () => {
  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    // Clear test data
    await AuditLog.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('AuditLog Model', () => {
    test('should create a new audit log entry', async () => {
      const logData = {
        userId: TEST_USER._id,
        userType: TEST_USER.role,
        action: 'TEST_ACTION',
        resourceType: 'test',
        resourceId: '123',
        details: { test: 'data' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        departmentId: TEST_USER.departmentId,
        success: true
      };

      const log = await AuditLog.logAction(logData);
      
      expect(log).toBeDefined();
      expect(log.user_id).toBe(TEST_USER._id);
      expect(log.action).toBe('TEST_ACTION');
      expect(log.success).toBe(true);
    });
  });

  describe('AuditLogService', () => {
    const AuditLogService = require('./backend/services/auditLogService');

    test('should log an action using the service', async () => {
      const logData = {
        userId: TEST_USER._id,
        userType: TEST_USER.role,
        action: 'SERVICE_TEST_ACTION',
        resourceType: 'test',
        resourceId: '456',
        details: { service: 'test' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        departmentId: TEST_USER.departmentId
      };

      const log = await AuditLogService.log(logData);
      
      expect(log).toBeDefined();
      expect(log.user_id).toBe(TEST_USER._id);
      expect(log.action).toBe('SERVICE_TEST_ACTION');
    });

    test('should get audit logs with filters', async () => {
      // Create test logs
      const logs = [
        {
          userId: TEST_USER._id,
          userType: 'staff',
          action: 'LOGIN',
          resourceType: 'auth',
          details: { method: 'POST', path: '/api/auth/login' },
          success: true
        },
        {
          userId: TEST_USER._id,
          userType: 'staff',
          action: 'LOGOUT',
          resourceType: 'auth',
          details: { method: 'POST', path: '/api/auth/logout' },
          success: true
        }
      ];

      await AuditLog.insertMany(logs);

      // Test filtering
      const result = await AuditLogService.getLogs({
        action: 'LOGIN',
        limit: 10,
        page: 1
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].action).toBe('LOGIN');
    });
  });

  describe('API Endpoints', () => {
    // Mock authentication middleware for testing
    const mockAuth = (req, res, next) => {
      req.user = TEST_USER;
      next();
    };

    // Apply mock auth to the app for testing
    const testApp = require('express')();
    testApp.use(require('body-parser').json());
    testApp.use(mockAuth);
    testApp.use('/api/audit-logs', require('./backend/routes/auditLogs'));

    test('GET /api/audit-logs should return audit logs', async () => {
      // Create test logs
      await AuditLog.insertMany([
        {
          userId: TEST_USER._id,
          userType: 'staff',
          action: 'API_TEST_ACTION',
          resourceType: 'test',
          details: { test: 'api' },
          success: true
        }
      ]);

      const res = await request(testApp)
        .get('/api/audit-logs')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toHaveProperty('total');
    });

    test('GET /api/audit-logs/actions should return available actions', async () => {
      const res = await request(testApp)
        .get('/api/audit-logs/actions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('actions');
      expect(Array.isArray(res.body.actions)).toBe(true);
      expect(res.body.actions.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Log Middleware', () => {
    const auditLogMiddleware = require('./backend/middleware/auditLogMiddleware');
    
    test('should log HTTP requests', async () => {
      const req = {
        method: 'GET',
        path: '/api/test',
        params: {},
        query: { test: 'value' },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
        user: TEST_USER
      };
      
      const res = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('application/json'),
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
        }),
        send: jest.fn()
      };
      
      const next = jest.fn();
      
      // Mock the log method
      const originalLog = AuditLog.logAction;
      AuditLog.logAction = jest.fn().mockResolvedValue({});
      
      // Call the middleware
      auditLogMiddleware(req, res, next);
      
      // Simulate response finish
      res.on.mock.calls.find(call => call[0] === 'finish')[1]();
      
      // Verify the log was created
      expect(AuditLog.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'GET_TEST',
        resourceType: 'test',
        ipAddress: '127.0.0.1',
        success: true
      }));
      
      // Restore original method
      AuditLog.logAction = originalLog;
    });
  });
});
