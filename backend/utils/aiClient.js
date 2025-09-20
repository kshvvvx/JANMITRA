const axios = require('axios');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class AIClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.AI_SERVICE_API_KEY || ''
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        config.headers['X-Request-ID'] = uuidv4();
        logger.info(`AI Service Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('AI Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`AI Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const errorData = error.response?.data || { message: error.message };
        logger.error('AI Service Error:', {
          status: error.response?.status,
          url: error.config?.url,
          data: errorData,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Analyze a complaint using the AI service
   * @param {Object} complaintData - The complaint data to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeComplaint(complaintData) {
    try {
      const response = await this.client.post('/api/ai/analyze', complaintData);
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze complaint with AI service:', error);
      throw this._handleError(error, 'Failed to analyze complaint');
    }
  }

  /**
   * Submit feedback about AI analysis
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Feedback submission result
   */
  async submitFeedback(feedback) {
    try {
      const response = await this.client.post('/api/ai/feedback', feedback);
      return response.data;
    } catch (error) {
      logger.error('Failed to submit AI feedback:', error);
      throw this._handleError(error, 'Failed to submit feedback');
    }
  }

  /**
   * Get AI service statistics
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} Service statistics
   */
  async getStats(params = {}) {
    try {
      const response = await this.client.get('/api/ai/stats', { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to get AI service stats:', error);
      throw this._handleError(error, 'Failed to get service statistics');
    }
  }

  /**
   * Health check for the AI service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('AI Service health check failed:', error);
      throw this._handleError(error, 'AI Service is unavailable');
    }
  }

  /**
   * Handle errors from the AI service
   * @private
   */
  _handleError(error, defaultMessage) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || defaultMessage;
      
      const err = new Error(errorMessage);
      err.status = status;
      err.data = data;
      return err;
    } else if (error.request) {
      // The request was made but no response was received
      const err = new Error('No response from AI service');
      err.status = 503;
      return err;
    } else {
      // Something happened in setting up the request
      const err = new Error(error.message || defaultMessage);
      err.status = 500;
      return err;
    }
  }
}

// Create a singleton instance
const aiClient = new AIClient();

module.exports = aiClient;
