// API service layer for JANMITRA frontend
// Handles all communication with the backend API

import {
  SendOTPRequest,
  VerifyOTPRequest,
  AuthResponse,
  CreateComplaintRequest,
  Complaint,
  ComplaintResponse,
  StaffLoginRequest,
  StaffLoginResponse,
} from '@/types/api';

const BASE_URL = 'http://localhost:5000/api';


class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        // If unauthorized, try to refresh token if this is a retry
        if (response.status === 401 && retryCount < 1) {
          // TODO: Implement token refresh logic
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Something went wrong');
      }

      return response.json();
    } catch (error: unknown) {
      const err = error as Error;
      
      // If we're offline, throw a special error that can be caught by the offline service
      if (err.message === 'Network request failed') {
        const networkError = new Error('NETWORK_ERROR');
        networkError.message = 'No internet connection';
        throw networkError;
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Method to submit a complaint with retry logic
  async submitComplaint(data: CreateComplaintRequest): Promise<Complaint> {
    try {
      return await this.createComplaint(data);
    } catch (error: unknown) {
      const err = error as Error;
      
      // If the error is a network error, rethrow it to be handled by the offline service
      if (err.message === 'NETWORK_ERROR') {
        throw error;
      }
      // For other errors, log and rethrow
      console.error('Failed to submit complaint:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return this.makeRequest('/health');
  }

  // Auth endpoints
  async sendOTP(data: SendOTPRequest): Promise<AuthResponse> {
    return this.makeRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    return this.makeRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Complaint endpoints
  async createComplaint(data: CreateComplaintRequest): Promise<Complaint> {
    return this.makeRequest<Complaint>('/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async getComplaints(params?: {
    near?: string;
    radius_km?: number;
    status?: string;
  }): Promise<ComplaintResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.near) {
      queryParams.append('near', params.near);
    }
    if (params?.radius_km) {
      queryParams.append('radius_km', params.radius_km.toString());
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/complaints?${queryString}` : '/complaints';
    
    return this.makeRequest(endpoint);
  }

  async getComplaintById(id: string): Promise<Complaint> {
    return this.makeRequest(`/complaints/${id}`);
  }

  async upvoteComplaint(id: string, citizen_id: string): Promise<{
    complaint_id: string;
    upvotes: number;
  }> {
    return this.makeRequest(`/complaints/${id}/upvote`, {
      method: 'POST',
      body: JSON.stringify({ citizen_id }),
    });
  }

  async refileComplaint(
    id: string,
    citizen_id: string,
    description: string,
    media?: any[]
  ): Promise<{
    complaint_id: string;
    refiles: number;
  }> {
    return this.makeRequest(`/complaints/${id}/refile`, {
      method: 'POST',
      body: JSON.stringify({
        citizen_id,
        description,
        media: media || [],
      }),
    });
  }

  async confirmResolution(id: string, citizen_id: string): Promise<{
    success: boolean;
    confirmations: number;
    status: string;
  }> {
    return this.makeRequest(`/complaints/${id}/confirm_resolution`, {
      method: 'POST',
      body: JSON.stringify({ citizen_id }),
    });
  }

  // Staff endpoints
  async staffLogin(data: StaffLoginRequest): Promise<StaffLoginResponse> {
    return this.makeRequest('/staff/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStaffComplaints(
    token: string,
    params?: {
      sort?: string;
      ward?: number;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ComplaintResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.ward) queryParams.append('ward', params.ward.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/staff/complaints?${queryString}` : '/staff/complaints';
    
    return this.makeRequest(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateComplaintStatus(
    id: string,
    token: string,
    data: {
      status: string;
      comment?: string;
      media?: any[];
      expected_resolution_date?: string;
    }
  ): Promise<{
    success: boolean;
    complaint: Complaint;
  }> {
    return this.makeRequest(`/staff/complaints/${id}/update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async getStaffComplaintHistory(
    token: string,
    params?: {
      from?: string;
      to?: string;
      ward?: number;
      urgencyMin?: number;
    }
  ): Promise<ComplaintResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.ward) queryParams.append('ward', params.ward.toString());
    if (params?.urgencyMin) queryParams.append('urgencyMin', params.urgencyMin.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/staff/complaints/history?${queryString}` : '/staff/complaints/history';
    
    return this.makeRequest(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type {
  SendOTPRequest,
  VerifyOTPRequest,
  AuthResponse,
  CreateComplaintRequest,
  Complaint,
  StaffLoginRequest,
  StaffLoginResponse,
};
