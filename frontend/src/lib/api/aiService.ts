import axios from 'axios';

const aiClient = axios.create({
  baseURL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface AIDangerScoreResponse {
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  confidence: number;
}

export interface AIAutoDescriptionResponse {
  description: string;
  keywords: string[];
  confidence: number;
  sentiment?: string;
}

export interface AIServiceResponse {
  danger_score: number;
  risk_level: string;
  auto_description: string;
  sentiment: string;
  is_duplicate: boolean;
  similar_complaints: any[];
  keywords: string[];
  confidence: number;
}

export interface ComplaintData {
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media_type?: string;
  media_count?: number;
  upvotes?: number;
  user_history?: any;
  additional_context?: any;
  language?: string;
}

class AIService {
  async analyzeText(text: string): Promise<AIServiceResponse> {
    try {
      const response = await aiClient.post('/api/ai/analyze', {
        description: text,
        category: 'General',
        location: {
          lat: 0,
          lng: 0,
          address: 'Unknown'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze text with AI service');
    }
  }

  async getDangerScore(complaintData: ComplaintData): Promise<AIDangerScoreResponse> {
    try {
      const response = await aiClient.post('/api/ai/danger-score', complaintData);
      return response.data;
    } catch (error: any) {
      console.error('Danger Score Error:', error);
      throw new Error('Failed to calculate danger score');
    }
  }

  async getAutoDescription(complaintData: ComplaintData): Promise<AIAutoDescriptionResponse> {
    try {
      const response = await aiClient.post('/api/ai/auto-description', complaintData);
      return response.data;
    } catch (error: any) {
      console.error('Auto Description Error:', error);
      throw new Error('Failed to generate auto description');
    }
  }

  async getSimilarComplaints(complaintData: ComplaintData, threshold = 0.7): Promise<any[]> {
    try {
      const response = await aiClient.post('/api/ai/similar-complaints', {
        ...complaintData,
        similarity_threshold: threshold
      });
      return response.data;
    } catch (error: any) {
      console.error('Similar Complaints Error:', error);
      return [];
    }
  }

  async submitFeedback(feedbackData: {
    complaint_id: string;
    feedback_type: 'positive' | 'negative' | 'correction';
    message?: string;
    corrections?: any;
    user_id?: string;
    session_id?: string;
  }): Promise<any> {
    try {
      const response = await aiClient.post('/api/ai/feedback', feedbackData);
      return response.data;
    } catch (error: any) {
      console.error('Feedback Submission Error:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  async getStats(hours = 24): Promise<any> {
    try {
      const response = await aiClient.get('/api/ai/stats', {
        params: { hours }
      });
      return response.data;
    } catch (error: any) {
      console.error('Stats Error:', error);
      throw new Error('Failed to get AI service statistics');
    }
  }
}

export default new AIService();
