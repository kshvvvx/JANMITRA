const { expect } = require('chai');
const nock = require('nock');
const aiClient = require('../../utils/aiClient');
const config = require('../../config/config');

describe('AIClient', () => {
  // Mock server
  const mockServer = nock(config.aiService.url)
    .defaultReplyHeaders({ 'Content-Type': 'application/json' });

  afterEach(() => {
    nock.cleanAll();
  });

  after(() => {
    nock.restore();
  });

  describe('analyzeComplaint', () => {
    it('should analyze a complaint successfully', async () => {
      const mockResponse = {
        danger_score: 7.5,
        risk_level: 'high',
        factors: ['location', 'keywords'],
        confidence: 0.9
      };

      mockServer
        .post('/api/ai/analyze')
        .reply(200, mockResponse);

      const result = await aiClient.analyzeComplaint({
        description: 'Broken street light causing safety issues',
        category: 'Infrastructure',
        location: { lat: 12.9716, lng: 77.5946 }
      });

      expect(result).to.deep.equal(mockResponse);
    });

    it('should handle API errors', async () => {
      mockServer
        .post('/api/ai/analyze')
        .reply(500, { error: 'Internal server error' });

      try {
        await aiClient.analyzeComplaint({});
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.status).to.equal(500);
        expect(error.message).to.include('Failed to analyze complaint');
      }
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedbackData = {
        complaint_id: '123',
        feedback_type: 'positive',
        message: 'Great analysis!'
      };

      const mockResponse = {
        status: 'success',
        feedback_id: 'feedback-123',
        timestamp: new Date().toISOString()
      };

      mockServer
        .post('/api/ai/feedback')
        .reply(200, mockResponse);

      const result = await aiClient.submitFeedback(feedbackData);
      expect(result).to.deep.equal(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should get service statistics', async () => {
      const mockStats = {
        total_requests: 100,
        avg_processing_time: 0.45,
        error_rate: 0.01,
        requests_by_type: {
          danger_score: 60,
          auto_description: 30,
          sentiment: 10
        }
      };

      mockServer
        .get('/api/ai/stats')
        .query({ hours: 24 })
        .reply(200, mockStats);

      const result = await aiClient.getStats({ hours: 24 });
      expect(result).to.deep.equal(mockStats);
    });
  });

  describe('healthCheck', () => {
    it('should check service health', async () => {
      const healthStatus = {
        status: 'ok',
        version: '1.0.0',
        services: {
          openai: 'ok',
          redis: 'ok',
          sentry: 'enabled'
        }
      };

      mockServer
        .get('/health')
        .reply(200, healthStatus);

      const result = await aiClient.healthCheck();
      expect(result).to.deep.equal(healthStatus);
    });
  });
});
