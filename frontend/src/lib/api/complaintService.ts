import apiClient from './client';

export interface Complaint {
  id: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: string[];
  status: 'unresolved' | 'in-progress' | 'resolved' | 'awaiting_confirmation';
  upvotes: number;
  created_at: string;
  updated_at: string;
  citizen_id: string;
  actions: Array<{
    type: string;
    timestamp: string;
    user_id: string;
    comment?: string;
  }>;
}

export interface CreateComplaintData {
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media?: string[];
  citizen_id?: string;
}

export interface UpdateComplaintData {
  status?: string;
  comment?: string;
}

class ComplaintService {
  async createComplaint(data: CreateComplaintData): Promise<Complaint> {
    try {
      const response = await apiClient.post('/api/complaints', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create complaint');
    }
  }

  async getComplaints(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: string;
  }): Promise<{ complaints: Complaint[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await apiClient.get('/api/complaints', { params });
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to fetch complaints');
    }
  }

  async getComplaintById(id: string): Promise<Complaint> {
    try {
      const response = await apiClient.get(`/api/complaints/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to fetch complaint details');
    }
  }

  async updateComplaintStatus(id: string, data: UpdateComplaintData): Promise<Complaint> {
    try {
      const response = await apiClient.put(`/api/complaints/${id}/status`, data);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to update complaint status');
    }
  }

  async upvoteComplaint(id: string): Promise<Complaint> {
    try {
      const response = await apiClient.post(`/api/complaints/${id}/upvote`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to upvote complaint');
    }
  }

  async refileComplaint(id: string, data: CreateComplaintData): Promise<Complaint> {
    try {
      const response = await apiClient.post(`/api/complaints/${id}/refile`, data);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to refile complaint');
    }
  }

  async confirmResolution(id: string): Promise<Complaint> {
    try {
      const response = await apiClient.post(`/api/complaints/${id}/confirm-resolution`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to confirm resolution');
    }
  }
}

export default new ComplaintService();
