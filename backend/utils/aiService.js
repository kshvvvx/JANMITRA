const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.timeout = 10000; // 10 seconds
  }

  // Calculate danger score for a complaint (0-10 scale)
  async calculateDangerScore(complaintData) {
    try {
      const response = await axios.post(`${this.baseURL}/danger-score`, {
        description: complaintData.description,
        category: complaintData.category || 'general',
        location: complaintData.location,
        media_count: complaintData.media ? complaintData.media.length : 0,
        upvotes: complaintData.upvotes ? complaintData.upvotes.length : 0
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        dangerScore: response.data.danger_score,
        factors: response.data.factors || [],
        confidence: response.data.confidence || 0.8
      };
    } catch (error) {
      console.error('AI danger score calculation failed:', error.message);
      
      // Fallback scoring based on keywords
      const fallbackScore = this.calculateFallbackDangerScore(complaintData);
      
      return {
        success: false,
        dangerScore: fallbackScore,
        factors: ['fallback_calculation'],
        confidence: 0.3,
        error: error.message
      };
    }
  }

  // Generate brief description (7-8 words) for a complaint
  async generateBriefDescription(complaintText) {
    try {
      const response = await axios.post(`${this.baseURL}/brief-description`, {
        text: complaintText,
        max_words: 8
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        briefDescription: response.data.brief_description,
        confidence: response.data.confidence || 0.8
      };
    } catch (error) {
      console.error('AI brief description generation failed:', error.message);
      
      // Fallback to first 8 words
      const words = complaintText.trim().split(/\s+/).slice(0, 8);
      const fallbackDescription = words.join(' ') + (words.length === 8 ? '...' : '');
      
      return {
        success: false,
        briefDescription: fallbackDescription,
        confidence: 0.2,
        error: error.message
      };
    }
  }

  // Categorize complaint automatically
  async categorizeComplaint(complaintData) {
    try {
      const response = await axios.post(`${this.baseURL}/categorize`, {
        description: complaintData.description,
        location: complaintData.location
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        category: response.data.category,
        confidence: response.data.confidence || 0.8,
        subcategory: response.data.subcategory || null
      };
    } catch (error) {
      console.error('AI categorization failed:', error.message);
      
      // Fallback categorization based on keywords
      const fallbackCategory = this.categorizeFallback(complaintData.description);
      
      return {
        success: false,
        category: fallbackCategory,
        confidence: 0.3,
        error: error.message
      };
    }
  }

  // Translate text between languages
  async translateText(text, targetLanguage = 'hi') {
    try {
      const response = await axios.post(`${this.baseURL}/translate`, {
        text: text,
        target_language: targetLanguage,
        source_language: 'auto'
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        translatedText: response.data.translated_text,
        sourceLanguage: response.data.detected_language || 'unknown',
        confidence: response.data.confidence || 0.8
      };
    } catch (error) {
      console.error('AI translation failed:', error.message);
      
      return {
        success: false,
        translatedText: text, // Return original text as fallback
        sourceLanguage: 'unknown',
        confidence: 0.0,
        error: error.message
      };
    }
  }

  // Fallback danger score calculation using keywords
  calculateFallbackDangerScore(complaintData) {
    const description = complaintData.description.toLowerCase();
    let score = 1; // Base score

    // High danger keywords
    const highDangerKeywords = [
      'fire', 'explosion', 'gas leak', 'electrical', 'accident', 'injury', 'death',
      'collapse', 'flood', 'emergency', 'urgent', 'dangerous', 'toxic', 'poison'
    ];

    // Medium danger keywords
    const mediumDangerKeywords = [
      'broken', 'damaged', 'leak', 'overflow', 'blocked', 'crack', 'hole',
      'unsafe', 'risk', 'hazard', 'problem', 'issue'
    ];

    // Check for high danger keywords
    highDangerKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        score += 3;
      }
    });

    // Check for medium danger keywords
    mediumDangerKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        score += 1;
      }
    });

    // Factor in upvotes (more upvotes = higher urgency)
    if (complaintData.upvotes) {
      score += Math.min(complaintData.upvotes.length * 0.5, 2);
    }

    // Factor in media (photos/videos indicate severity)
    if (complaintData.media && complaintData.media.length > 0) {
      score += Math.min(complaintData.media.length * 0.3, 1);
    }

    return Math.min(Math.round(score), 10); // Cap at 10
  }

  // Fallback categorization using keywords
  categorizeFallback(description) {
    const text = description.toLowerCase();

    if (text.includes('road') || text.includes('street') || text.includes('pothole') || 
        text.includes('traffic') || text.includes('signal')) {
      return 'roads';
    }
    
    if (text.includes('water') || text.includes('pipe') || text.includes('leak') || 
        text.includes('supply') || text.includes('drainage')) {
      return 'water';
    }
    
    if (text.includes('electricity') || text.includes('power') || text.includes('light') || 
        text.includes('pole') || text.includes('wire')) {
      return 'electricity';
    }
    
    if (text.includes('garbage') || text.includes('waste') || text.includes('clean') || 
        text.includes('toilet') || text.includes('sewer')) {
      return 'sanitation';
    }
    
    if (text.includes('park') || text.includes('garden') || text.includes('tree') || 
        text.includes('green')) {
      return 'parks';
    }

    return 'general';
  }

  // Health check for AI service
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        service_version: response.data.version || 'unknown',
        response_time: response.data.response_time || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
