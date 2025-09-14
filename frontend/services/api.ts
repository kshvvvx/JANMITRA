// API service layer for JANMITRA frontend
// Handles all communication with the backend API

const BASE_URL = 'http://localhost:5000/api';

// Auth endpoints
export interface SendOTPRequest {
  phoneNumber: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
}

export interface Complaint {
  complaint_id: string;
  citizen_id: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: Array<{
    type: string;
    url: string;
  }>;
  status: string;
  created_at: string;
  upvotes: string[];
  refiles: Array<{
    citizen_id: string;
    description: string;
    media: any[];
    created_at: string;
  }>;
  actions: Array<{
    actorType: string;
    action: string;
    timestamp: string;
    details?: any;
  }>;
  confirmations: string[];
}

export interface CreateComplaintRequest {
  citizen_id: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media?: Array<{
    type: string;
    url: string;
  }>;
}

export interface StaffLoginRequest {
  dept: string;
  staff_id: string;
}

export interface StaffLoginResponse {
  success: boolean;
  token: string;
  staff: {
    staff_id: string;
    name: string;
    dept: string;
    wards: number[];
  };
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
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
  async createComplaint(data: CreateComplaintRequest): Promise<{
    complaint_id: string;
    status: string;
    created_at: string;
  }> {
    return this.makeRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getComplaints(params?: {
    near?: string;
    radius_km?: number;
    status?: string;
  }): Promise<{
    count: number;
    complaints: Complaint[];
  }> {
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
  ): Promise<{
    count: number;
    complaints: Complaint[];
  }> {
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
  ): Promise<{
    count: number;
    complaints: Complaint[];
  }> {
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
export type { Complaint, CreateComplaintRequest, StaffLoginRequest, StaffLoginResponse };
