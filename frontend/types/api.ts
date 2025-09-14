// API request/response types for JANMITRA

// Media type for complaints
export interface ComplaintMedia {
  type: string;
  url: string;
  thumbnail?: string;
  duration?: number;
}

// Base complaint interface
export interface BaseComplaint {
  id: string;
  citizen_id: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media: ComplaintMedia[];
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  upvotes: string[];
  confirmations: string[];
  actions: {
    actorType: string;
    action: string;
    timestamp: string;
    details?: any;
  }[];
  refiles: {
    citizen_id: string;
    description: string;
    media: any[];
    created_at: string;
  }[];
}

// Request/Response types
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

export interface CreateComplaintRequest {
  citizen_id: string;
  title?: string;
  description: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  media?: ComplaintMedia[];
  phoneNumber?: string;
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

// Complaint extends BaseComplaint with additional properties
export interface Complaint extends BaseComplaint {
  title?: string;
  priority: 'low' | 'medium' | 'high';
  updatedAt: string;
  userId: string;
  userName: string;
  userPhone: string;
  isAnonymous: boolean;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface ComplaintResponse {
  count: number;
  complaints: Complaint[];
}
